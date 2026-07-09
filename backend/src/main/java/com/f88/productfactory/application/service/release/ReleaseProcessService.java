package com.f88.productfactory.application.service.release;

import com.f88.productfactory.domain.model.pipeline.ProductVariant;
import com.f88.productfactory.domain.model.release.MakerCheckerProcess;
import com.f88.productfactory.domain.model.release.ProcessStep;
import com.f88.productfactory.domain.model.release.ProcessStepChecklist;
import com.f88.productfactory.domain.repository.pipeline.ProductVariantRepository;
import com.f88.productfactory.domain.repository.release.MakerCheckerProcessRepository;
import com.f88.productfactory.domain.repository.release.ProcessStepChecklistRepository;
import com.f88.productfactory.domain.repository.release.ProcessStepRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Quy trình phát hành (Release / Maker–Checker, Lớp IV — Governance).
 *
 * Prototype: `isRelease` không phải list mà là stepper 8 bước (`releaseSteps()`/`releaseData()`
 * trong bundler, dòng ~3687-3761) + view phụ "Sơ đồ Swimlane". Dữ liệu 8 bước trong bundler là
 * hardcode nhưng KHỚP GẦN NHƯ Y HỆT seed thật (`maker_checker_process`/`process_step`/
 * `process_step_checklist`) — title/role/input_desc/output_desc/step_status/is_done đều lấy
 * thật từ DB. `desc`/`tip`/`icon` trong bundler là copy mô tả tĩnh của quy trình chuẩn công ty
 * (không đổi theo instance, không có cột DB) — giữ lại như hằng số UI (STEP_META) vì đây là văn
 * bản hướng dẫn quy trình cố định, không phải dữ liệu nghiệp vụ có thể sai theo dòng.
 *
 * `productName`/`productCode` của prototype hardcode 'Vay nhanh Xe máy 18 tháng' /
 * 'CFG-0042 → VAR-101' — khớp thật với maker_checker_process.product_name / variant_code, nên
 * trả thẳng 2 cột đó (không cần tách chuỗi).
 */
@Service
public class ReleaseProcessService {

    /** Copy mô tả tĩnh của quy trình chuẩn (không có cột DB — không đổi theo instance). */
    private static final String[] DESC = {
            "Khởi nguồn từ định hướng kinh doanh: xác định mục tiêu, tệp khách hàng và Financial Obligation Archetype phù hợp.",
            "Cụ thể hóa ý định sản phẩm: chọn Financial Obligation Archetype và điền Obligation Element (OE) cho các OT lõi để hình thành Obligation Type Family (OTF).",
            "Vẽ khuôn sản phẩm: kéo-thả Block vào cấu trúc và gán Obligation Type cho khuôn.",
            "Cụ thể hóa Pattern cho một đối tượng khách hàng (cá nhân/doanh nghiệp) và bối cảnh bán.",
            "Điền giá trị cho Answer Slot, tạo Config Fragment có thể giới hạn theo Selector Scope.",
            "Chạy Simulation Engine: dựng lịch trả nợ, dòng tiền và kiểm tra toàn bộ ràng buộc trước khi trình duyệt.",
            "Trình duyệt theo vòng đời Config: Checker rà soát, phê duyệt hoặc trả lại kèm ý kiến.",
            "Đóng gói Product Variant từ Config đã duyệt, chọn kênh phân phối và xuất bản lên Catalog.",
    };
    private static final String[] TIP = {
            "1 Business Intent có thể dẫn xuất nhiều Product Intent.",
            "Ma trận FOA × Obligation Element sẽ giới hạn OE hợp lệ theo Archetype đã chọn.",
            "Đối chiếu Ma trận Obligation Element × Block để không thiếu Block.",
            "Template thừa kế cấu trúc Block từ Pattern nguồn.",
            "Mỗi Fragment gán 1 giá trị, có thể chồng theo Selector Scope.",
            "Verdict \"Hợp lệ\" là điều kiện cần để gửi duyệt.",
            "Maker không được tự duyệt config của mình.",
            "Sau phát hành, Variant đi theo vòng đời sản phẩm.",
    };
    private static final String[] ICON = {"target", "intent", "pattern", "template", "config", "sim", "lifecycle", "rocket"};
    /** Điều hướng thật tới màn tương ứng nếu đã dựng; null nếu màn đích chưa có (vd Simulation). */
    private static final String[] NAV = {"businessintent", "intent", "pattern", "template", "config", null, "config", "catalog"};

    private final MakerCheckerProcessRepository processRepo;
    private final ProcessStepRepository stepRepo;
    private final ProcessStepChecklistRepository checklistRepo;
    private final ProductVariantRepository variantRepo;

    public ReleaseProcessService(MakerCheckerProcessRepository processRepo,
                                 ProcessStepRepository stepRepo,
                                 ProcessStepChecklistRepository checklistRepo,
                                 ProductVariantRepository variantRepo) {
        this.processRepo = processRepo;
        this.stepRepo = stepRepo;
        this.checklistRepo = checklistRepo;
        this.variantRepo = variantRepo;
    }

    /**
     * Số bước "done" ứng với trạng thái thật của variant — bước 7 = Phê duyệt (Maker–Checker),
     * bước 8 = Đóng gói & Phát hành Catalog. Tính runtime từ product_variant.status để luôn
     * đồng bộ với Catalog, không lưu số liệu trùng lặp dễ lệch theo từng variant.
     */
    private int doneCountFor(String status) {
        return switch (status) {
            case "draft" -> 5;
            case "review" -> 6;
            case "approved" -> 7;
            case "published", "retired" -> 8;
            default -> 0;
        };
    }

    /**
     * Chi tiết quy trình phát hành CỦA MỘT VARIANT: { process:{id,productName,productCode,
     * doneCount,totalSteps}, steps:[{stepNo,title,role,status,inputDesc,outputDesc,desc,tip,
     * icon,nav,checklist:[{sortOrder,item,done}]}] }.
     *
     * Chỉ có 1 process template chuẩn 8 bước trong DB (title/role/input/output/checklist —
     * mô tả quy trình chung, không đổi theo sản phẩm). Trạng thái done/current/upcoming của
     * từng bước tính runtime từ variant.status thật, không đọc process_step.step_status/
     * maker_checker_process.done_count của template (tránh lệch dữ liệu giữa các variant).
     */
    public Optional<Map<String, Object>> detailByVariant(String variantCode) {
        Optional<ProductVariant> variantOpt = variantRepo.findById(variantCode);
        if (variantOpt.isEmpty()) {
            return Optional.empty();
        }
        ProductVariant variant = variantOpt.get();

        return processRepo.findFirstByOrderById().map(template -> {
            List<ProcessStep> steps = stepRepo.findByProcessIdOrderByStepNo(template.getId());
            int doneCount = doneCountFor(variant.getStatus());

            Map<String, Object> processMeta = new LinkedHashMap<>();
            processMeta.put("id", template.getId());
            processMeta.put("productName", variant.getName());
            processMeta.put("productCode", variant.getCode());
            processMeta.put("doneCount", doneCount);
            processMeta.put("totalSteps", steps.size());

            List<Map<String, Object>> stepRows = new ArrayList<>();
            for (ProcessStep s : steps) {
                int i = s.getStepNo() - 1;
                String status = s.getStepNo() <= doneCount ? "done"
                        : s.getStepNo() == doneCount + 1 ? "current"
                        : "upcoming";

                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("stepNo", s.getStepNo());
                sm.put("title", s.getTitle());
                sm.put("role", s.getRole());
                sm.put("status", status);
                sm.put("inputDesc", s.getInputDesc());
                sm.put("outputDesc", s.getOutputDesc());
                sm.put("desc", i >= 0 && i < DESC.length ? DESC[i] : null);
                sm.put("tip", i >= 0 && i < TIP.length ? TIP[i] : null);
                sm.put("icon", i >= 0 && i < ICON.length ? ICON[i] : null);
                sm.put("nav", i >= 0 && i < NAV.length ? NAV[i] : null);

                List<Map<String, Object>> checklist = new ArrayList<>();
                for (ProcessStepChecklist c : checklistRepo.findByProcessIdAndStepNoOrderBySortOrder(template.getId(), s.getStepNo())) {
                    Map<String, Object> cm = new LinkedHashMap<>();
                    cm.put("sortOrder", c.getSortOrder());
                    cm.put("item", c.getItem());
                    cm.put("done", "done".equals(status));
                    checklist.add(cm);
                }
                sm.put("checklist", checklist);
                stepRows.add(sm);
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("process", processMeta);
            body.put("steps", stepRows);
            return body;
        });
    }
}
