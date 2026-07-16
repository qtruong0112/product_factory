package com.f88.productfactory.application.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Use-case chung cho các bảng tra cứu read-only — lớp application bọc quanh JpaRepository (repository
 * port ở infrastructure.persistence), để presentation không phụ thuộc thẳng vào infrastructure.
 *
 * @param <T>  kiểu entity
 * @param <ID> kiểu khóa chính
 */
public class ReadOnlyService<T, ID> {

    private final JpaRepository<T, ID> repository;

    public ReadOnlyService(JpaRepository<T, ID> repository) {
        this.repository = repository;
    }

    public Page<T> list(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Optional<T> byId(ID id) {
        return repository.findById(id);
    }
}
