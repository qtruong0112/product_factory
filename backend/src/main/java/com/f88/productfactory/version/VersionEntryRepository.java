package com.f88.productfactory.version;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VersionEntryRepository extends JpaRepository<VersionEntry, Long> {

    // entity_type là Postgres enum thật (version_entity_type_enum) — cần CAST tường minh khi so
    // sánh với tham số String, nếu không Postgres báo "operator does not exist: enum = varchar".
    @Query(value = "select * from version_entry where entity_type = CAST(:entityType AS version_entity_type_enum) "
            + "and entity_code = :entityCode order by created_at desc", nativeQuery = true)
    List<VersionEntry> findByEntityTypeAndEntityCodeOrderByCreatedAtDesc(
            @Param("entityType") String entityType, @Param("entityCode") String entityCode);
}
