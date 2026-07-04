package com.f88.productfactory.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Base controller read-only cho các bảng tra cứu.
 * Mỗi bảng chỉ cần kế thừa và cung cấp repository — tự có 2 endpoint:
 *   GET /{base}          -> danh sách (phân trang)
 *   GET /{base}/{id}     -> chi tiết theo khóa chính
 *
 * @param <T>  kiểu entity
 * @param <ID> kiểu khóa chính
 */
public abstract class ReadOnlyController<T, ID> {

    protected abstract JpaRepository<T, ID> repository();

    @GetMapping
    public Page<T> list(@PageableDefault(size = 50) Pageable pageable) {
        return repository().findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<T> byId(@PathVariable ID id) {
        return repository().findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
