package com.f88.productfactory.application.service.version;

import com.f88.productfactory.domain.model.version.VersionEntry;
import com.f88.productfactory.domain.repository.version.VersionEntryRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lịch sử phiên bản (nút "Phiên bản" ở Product Pattern/Product Config, bundler `verHistory`).
 *
 * Prototype: cột `note` gộp "tóm tắt thay đổi | change1; change2; ..." vì schema v3 không có
 * bảng version_change riêng — tách lại đúng 2 phần: title (trước " | ") và changes[]
 * (sau " | ", tách theo "; ") để frontend dựng lại đúng cấu trúc card (tiêu đề + danh sách gạch
 * đầu dòng) như bundler gốc.
 */
@Service
public class VersionEntryService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final VersionEntryRepository repo;

    public VersionEntryService(VersionEntryRepository repo) {
        this.repo = repo;
    }

    public List<Map<String, Object>> list(String entityType, String entityCode) {
        List<VersionEntry> entries = repo.findByEntityTypeAndEntityCodeOrderByCreatedAtDesc(entityType, entityCode);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (VersionEntry v : entries) {
            String note = v.getNote() == null ? "" : v.getNote();
            String title;
            List<String> changes;
            int sep = note.indexOf(" | ");
            if (sep >= 0) {
                title = note.substring(0, sep);
                changes = Arrays.asList(note.substring(sep + 3).split(";\\s*"));
            } else {
                title = note;
                changes = List.of();
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("version", v.getVersion());
            row.put("status", v.getStatus());
            row.put("active", v.isActive());
            row.put("head", v.isHead());
            row.put("author", v.getAuthor());
            row.put("createdAt", v.getCreatedAt().toString());
            row.put("createdAtLabel", v.getCreatedAt().format(TIME_FMT));
            row.put("title", title);
            row.put("changes", changes);
            rows.add(row);
        }
        return rows;
    }
}
