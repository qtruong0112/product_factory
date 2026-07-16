package com.f88.productfactory.application.service.pipeline;

import com.f88.productfactory.domain.model.pipeline.CustomerSegment;
import com.f88.productfactory.domain.model.pipeline.PatternBlock;
import com.f88.productfactory.domain.model.pipeline.ProductPattern;
import com.f88.productfactory.domain.model.pipeline.ProductTemplate;
import com.f88.productfactory.domain.model.pipeline.TemplateFrame;
import com.f88.productfactory.domain.model.pipeline.TemplateSegment;
import com.f88.productfactory.domain.model.structure.AnswerSlot;
import com.f88.productfactory.domain.model.structure.Block;
import com.f88.productfactory.infrastructure.persistence.pipeline.CustomerSegmentRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.PatternBlockRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductPatternRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.ProductTemplateRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.TemplateFrameRepository;
import com.f88.productfactory.infrastructure.persistence.pipeline.TemplateSegmentRepository;
import com.f88.productfactory.infrastructure.persistence.structure.AnswerSlotRepository;
import com.f88.productfactory.infrastructure.persistence.structure.BlockRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Product Template (Lớp III — Pipeline).
 *
 * Prototype: màn LIST đơn thuần (KHÔNG phải builder — xác nhận qua `openTplWizard` luôn
 * reset `tplStep:0` bất kể dòng nào được click). Wizard "Tạo Product Template" 3 bước của
 * prototype dùng TOÀN BỘ dữ liệu TĨNH (`TPL_BLOCKS` catalog cứng + `state.tpl` khởi tạo cứng,
 * xác nhận bằng cách đọc trực tiếp bundler JS — không đổi theo dòng click). Vì vậy KHÔNG dựng
 * lại wizard TẠO MỚI, mà dựng detail() = xem (không sửa) dữ liệu THẬT của 1 template đã
 * có, tái dùng đúng layout 3 bước cho quen mắt nhưng đổ toàn bộ bằng DB thật:
 *   - Bước 1 (đối tượng KH): thật 100% — product_template.name + template_segment→customer_segment.
 *   - Bước 2 (Block áp dụng): KHÔNG có cột DB nào lưu trạng thái "khóa" theo từng template →
 *     suy ra "đang áp dụng" = block có ít nhất 1 dòng template_frame cho template đó (quyết định
 *     của user, không fabricate cột không tồn tại).
 *   - Bước 3 (giá trị khung Answer Slot): thật 100% từ template_frame (nhiều template chỉ có 1
 *     phần hoặc 0 dòng trong seed — hiển thị đúng thực trạng, không bịa giá trị mặc định).
 *
 * List cần join tên Pattern nguồn + tên Đối tượng KH (customer_segment qua template_segment)
 * — dữ liệu join, không phải cột entity — nên tự dựng Page<Map> thay vì ReadOnlyController.
 * Cột "CẬP NHẬT" của prototype KHÔNG có cột nguồn trong product_template → bỏ (quy tắc vàng).
 */
@Service
public class ProductTemplateService {

    private final ProductTemplateRepository repo;
    private final ProductPatternRepository patternRepo;
    private final TemplateSegmentRepository templateSegmentRepo;
    private final CustomerSegmentRepository segmentRepo;
    private final PatternBlockRepository patternBlockRepo;
    private final BlockRepository blockRepo;
    private final AnswerSlotRepository slotRepo;
    private final TemplateFrameRepository frameRepo;

    public ProductTemplateService(ProductTemplateRepository repo,
                                  ProductPatternRepository patternRepo,
                                  TemplateSegmentRepository templateSegmentRepo,
                                  CustomerSegmentRepository segmentRepo,
                                  PatternBlockRepository patternBlockRepo,
                                  BlockRepository blockRepo,
                                  AnswerSlotRepository slotRepo,
                                  TemplateFrameRepository frameRepo) {
        this.repo = repo;
        this.patternRepo = patternRepo;
        this.templateSegmentRepo = templateSegmentRepo;
        this.segmentRepo = segmentRepo;
        this.patternBlockRepo = patternBlockRepo;
        this.blockRepo = blockRepo;
        this.slotRepo = slotRepo;
        this.frameRepo = frameRepo;
    }

    /**
     * Danh sách Product Template (làm giàu):
     * mỗi phần tử = { code, name, fromPatternCode, patternName, segmentCode, segmentName, status }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ProductTemplate> page = repo.findAll(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ProductTemplate t : page.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", t.getCode());
            row.put("name", t.getName());
            row.put("fromPatternCode", t.getFromPatternCode());
            row.put("patternName", patternRepo.findById(t.getFromPatternCode())
                    .map(ProductPattern::getName).orElse(t.getFromPatternCode()));

            TemplateSegment seg = templateSegmentRepo.findByTemplateCode(t.getCode())
                    .stream().findFirst().orElse(null);
            String segmentCode = seg != null ? seg.getSegmentCode() : null;
            row.put("segmentCode", segmentCode);
            row.put("segmentName", segmentCode != null
                    ? segmentRepo.findById(segmentCode).map(CustomerSegment::getName).orElse(segmentCode)
                    : null);

            row.put("status", t.getStatus());
            rows.add(row);
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /**
     * Chi tiết Product Template (XEM, không sửa) — dựng lại đúng bố cục 3 bước của wizard
     * prototype nhưng đổ toàn bộ bằng dữ liệu thật:
     * { template:{code,name,fromPatternCode,status}, patternName, patternCode,
     *   segmentCode, segmentName, audience,
     *   blocks:[{blockId,name,bizGroup,active,slots:[{code,name,frameValue}]}] }.
     *
     * blocks = pattern_block của from_pattern_code (thứ tự position); mỗi block lấy toàn bộ
     * answer_slot của nó; frameValue = giá trị template_frame nếu có (null nếu chưa đặt).
     * active = block có ít nhất 1 dòng template_frame cho template này (không có cột "khóa" thật).
     */
    public Optional<Map<String, Object>> detail(String code) {
        return repo.findById(code).map(t -> {
            Map<String, Object> body = new LinkedHashMap<>();
            Map<String, Object> templateMeta = new LinkedHashMap<>();
            templateMeta.put("code", t.getCode());
            templateMeta.put("name", t.getName());
            templateMeta.put("fromPatternCode", t.getFromPatternCode());
            templateMeta.put("status", t.getStatus());
            body.put("template", templateMeta);

            body.put("patternName", patternRepo.findById(t.getFromPatternCode())
                    .map(ProductPattern::getName).orElse(t.getFromPatternCode()));

            TemplateSegment seg = templateSegmentRepo.findByTemplateCode(code)
                    .stream().findFirst().orElse(null);
            String segmentCode = seg != null ? seg.getSegmentCode() : null;
            CustomerSegment segment = segmentCode != null ? segmentRepo.findById(segmentCode).orElse(null) : null;
            body.put("segmentCode", segmentCode);
            body.put("segmentName", segment != null ? segment.getName() : segmentCode);
            body.put("audience", segment != null ? segment.getAudience() : null);

            // Giá trị khung thật của template, gom theo (block_id, slot_code).
            Map<String, String> frameByKey = new LinkedHashMap<>();
            for (TemplateFrame f : frameRepo.findByTemplateCode(code)) {
                frameByKey.put(f.getBlockId() + "" + f.getSlotCode(), f.getFrameValue());
            }

            List<Map<String, Object>> blocks = new ArrayList<>();
            for (PatternBlock pb : patternBlockRepo.findByPatternCodeOrderByPosition(t.getFromPatternCode())) {
                Block block = blockRepo.findById(pb.getBlockId()).orElse(null);
                Map<String, Object> bm = new LinkedHashMap<>();
                bm.put("blockId", pb.getBlockId());
                bm.put("name", block != null ? block.getName() : pb.getBlockId());
                bm.put("bizGroup", block != null ? block.getBizGroup() : null);

                List<Map<String, Object>> slots = new ArrayList<>();
                boolean active = false;
                for (AnswerSlot s : slotRepo.findByBlockId(pb.getBlockId())) {
                    String frameValue = frameByKey.get(pb.getBlockId() + "" + s.getCode());
                    if (frameValue != null) active = true;
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("code", s.getCode());
                    sm.put("name", s.getName());
                    sm.put("frameValue", frameValue);
                    slots.add(sm);
                }
                bm.put("active", active);
                bm.put("slots", slots);
                blocks.add(bm);
            }
            body.put("blocks", blocks);

            return body;
        });
    }
}
