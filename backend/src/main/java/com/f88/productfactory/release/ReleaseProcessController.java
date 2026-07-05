package com.f88.productfactory.release;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
@RestController
@RequestMapping("/api/release-processes")
public class ReleaseProcessController {

    /** Copy mô tả tĩnh của quy trình chuẩn (không có cột DB — không đổi theo instance). */
    private static final String[] DESC = {
            "Khởi nguồn từ định hướng kinh doanh: xác định mục tiêu, tệp khách hàng và Financial Obligation Archetype phù hợp.",
            "Cụ thể hóa ý định sản phẩm: gắn Obligation Nature (is_identify) và bản chất nghĩa vụ tài chính.",
            "Vẽ khuôn sản phẩm: kéo-thả Block vào cấu trúc và gán Obligation Type cho khuôn.",
            "Cụ thể hóa Pattern cho một đối tượng khách hàng (cá nhân/doanh nghiệp) và bối cảnh bán.",
            "Điền giá trị cho Answer Slot, tạo Config Fragment có thể giới hạn theo Selector Scope.",
            "Chạy Simulation Engine: dựng lịch trả nợ, dòng tiền và kiểm tra toàn bộ ràng buộc trước khi trình duyệt.",
            "Trình duyệt theo vòng đời Config: Checker rà soát, phê duyệt hoặc trả lại kèm ý kiến.",
            "Đóng gói Product Variant từ Config đã duyệt, chọn kênh phân phối và xuất bản lên Catalog.",
    };
    private static final String[] TIP = {
            "1 Business Intent có thể dẫn xuất nhiều Product Intent.",
            "Ma trận ràng buộc sẽ suy diễn Family hợp lệ cho Intent.",
            "Đối chiếu Ma trận Obligation Type × Block để không thiếu Block.",
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

    public ReleaseProcessController(MakerCheckerProcessRepository processRepo,
                                    ProcessStepRepository stepRepo,
                                    ProcessStepChecklistRepository checklistRepo) {
        this.processRepo = processRepo;
        this.stepRepo = stepRepo;
        this.checklistRepo = checklistRepo;
    }

    /** Danh sách quy trình phát hành: { id, productName, productCode, doneCount, totalSteps }. */
    @GetMapping
    public Page<Map<String, Object>> list(@PageableDefault(size = 20) Pageable pageable) {
        Page<MakerCheckerProcess> page = processRepo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (MakerCheckerProcess p : page.getContent()) {
            int totalSteps = stepRepo.findByProcessIdOrderByStepNo(p.getId()).size();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.getId());
            row.put("productName", p.getProductName());
            row.put("productCode", p.getVariantCode());
            row.put("doneCount", p.getDoneCount());
            row.put("totalSteps", totalSteps);
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /**
     * Chi tiết quy trình: { process:{id,productName,productCode,doneCount,totalSteps},
     * steps:[{stepNo,title,role,status,inputDesc,outputDesc,desc,tip,icon,nav,
     *         checklist:[{sortOrder,item,done}]}] }.
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable Long id) {
        return processRepo.findById(id).map(p -> {
            List<ProcessStep> steps = stepRepo.findByProcessIdOrderByStepNo(id);

            Map<String, Object> processMeta = new LinkedHashMap<>();
            processMeta.put("id", p.getId());
            processMeta.put("productName", p.getProductName());
            processMeta.put("productCode", p.getVariantCode());
            processMeta.put("doneCount", p.getDoneCount());
            processMeta.put("totalSteps", steps.size());

            List<Map<String, Object>> stepRows = new ArrayList<>();
            for (ProcessStep s : steps) {
                int i = s.getStepNo() - 1;
                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("stepNo", s.getStepNo());
                sm.put("title", s.getTitle());
                sm.put("role", s.getRole());
                sm.put("status", s.getStepStatus());
                sm.put("inputDesc", s.getInputDesc());
                sm.put("outputDesc", s.getOutputDesc());
                sm.put("desc", i >= 0 && i < DESC.length ? DESC[i] : null);
                sm.put("tip", i >= 0 && i < TIP.length ? TIP[i] : null);
                sm.put("icon", i >= 0 && i < ICON.length ? ICON[i] : null);
                sm.put("nav", i >= 0 && i < NAV.length ? NAV[i] : null);

                List<Map<String, Object>> checklist = new ArrayList<>();
                for (ProcessStepChecklist c : checklistRepo.findByProcessIdAndStepNoOrderBySortOrder(id, s.getStepNo())) {
                    Map<String, Object> cm = new LinkedHashMap<>();
                    cm.put("sortOrder", c.getSortOrder());
                    cm.put("item", c.getItem());
                    cm.put("done", c.isDone());
                    checklist.add(cm);
                }
                sm.put("checklist", checklist);
                stepRows.add(sm);
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("process", processMeta);
            body.put("steps", stepRows);
            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }
}
