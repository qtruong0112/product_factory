package com.f88.productfactory.application.service.activity;

import com.f88.productfactory.domain.model.activity.ActivityLog;
import com.f88.productfactory.infrastructure.persistence.activity.ActivityLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Nhật ký hoạt động (Activity Log, Lớp IV — Governance).
 *
 * Prototype: list đơn thuần (`v==='activity'`, bundler dòng ~3168-3181), 8 dòng hardcode khớp
 * y hệt seed thật `activity_log` (8 dòng). Cột "HÀNH ĐỘNG" của prototype là câu diễn giải tự do
 * ghép động từ + loại đối tượng ("Gửi duyệt Config") — không có cột riêng, nên map lại từ
 * `action` (code chuẩn hoá) sang động từ tiếng Việt qua ACTION_LABEL. Cột "KÊNH" không có cột
 * DB riêng, nhưng mọi dòng `detail` thật đều có hậu tố "· kênh X" — suy ra bằng regex (không
 * bịa: parse từ text thật, khớp đúng 8/8 dòng seed với giá trị Web/API của prototype). Footer
 * "Hiển thị .. trên 1.284 hoạt động" của prototype là số bịa — dùng COUNT thật (8) thay thế.
 */
@Service
public class ActivityLogService {

    private static final Map<String, String> ACTION_LABEL = Map.of(
            "create", "Tạo",
            "update", "Cập nhật",
            "approve", "Phê duyệt",
            "submit_review", "Gửi duyệt",
            "publish", "Xuất bản",
            "retire", "Thu hồi",
            "assign", "Gán",
            "sync", "Đồng bộ"
    );
    private static final Pattern CHANNEL_PATTERN = Pattern.compile("kênh\\s+(\\S+)");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("dd/MM HH:mm");

    private final ActivityLogRepository repo;

    public ActivityLogService(ActivityLogRepository repo) {
        this.repo = repo;
    }

    /**
     * Danh sách hoạt động (mới nhất trước):
     * { occurredAt, occurredAtLabel, actor, action, actionLabel, entityType, entityCode, channel, detail }.
     */
    public Page<Map<String, Object>> list(Pageable pageable) {
        Page<ActivityLog> page = repo.findAllByOrderByOccurredAtDesc(pageable);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ActivityLog a : page.getContent()) {
            rows.add(toRow(a));
        }
        return new PageImpl<>(rows, pageable, page.getTotalElements());
    }

    /** Nhật ký của riêng 1 entity (vd 1 Product Variant) — cho phần "Hoạt động gần đây" ở màn chi tiết. */
    public List<Map<String, Object>> forEntity(String entityType, String entityCode) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ActivityLog a : repo.findByEntityTypeAndEntityCodeOrderByOccurredAtDesc(entityType, entityCode)) {
            rows.add(toRow(a));
        }
        return rows;
    }

    /** Chi tiết 1 dòng hoạt động theo id — cho màn "detail" của Nhật ký hoạt động. */
    public Optional<Map<String, Object>> detail(Long id) {
        return repo.findById(id).map(ActivityLogService::toRow);
    }

    private static Map<String, Object> toRow(ActivityLog a) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", a.getId());
        row.put("occurredAt", a.getOccurredAt().toString());
        row.put("occurredAtLabel", a.getOccurredAt().format(TIME_FMT));
        row.put("actor", a.getActor());
        row.put("action", a.getAction());
        row.put("actionLabel", ACTION_LABEL.getOrDefault(a.getAction(), a.getAction()));
        row.put("entityType", a.getEntityType());
        row.put("entityCode", a.getEntityCode());
        row.put("channel", extractChannel(a.getDetail()));
        row.put("detail", a.getDetail());
        return row;
    }

    private static String extractChannel(String detail) {
        if (detail == null) return null;
        Matcher m = CHANNEL_PATTERN.matcher(detail);
        return m.find() ? m.group(1) : null;
    }
}
