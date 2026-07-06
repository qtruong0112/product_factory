package com.f88.productfactory.presentation.common;

import com.f88.productfactory.application.common.ReadOnlyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Base controller read-only cho các bảng tra cứu.
 * Mỗi bảng chỉ cần kế thừa và cung cấp {@link ReadOnlyService} — tự có 2 endpoint:
 *   GET /{base}          -> danh sách (phân trang)
 *   GET /{base}/{id}     -> chi tiết theo khóa chính
 *
 * @param <T>  kiểu entity
 * @param <ID> kiểu khóa chính
 */
public abstract class ReadOnlyController<T, ID> {

    protected abstract ReadOnlyService<T, ID> service();

    @GetMapping
    public Page<T> list(@PageableDefault(size = 50) Pageable pageable) {
        return service().list(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<T> byId(@PathVariable ID id) {
        return service().byId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
