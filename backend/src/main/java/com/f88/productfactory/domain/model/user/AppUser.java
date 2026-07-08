package com.f88.productfactory.domain.model.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Bảng app_user (Giai đoạn 42) — người dùng thật cho bộ chọn "đổi vai trò" ở sidebar (lọc menu
 * phía frontend, KHÔNG phải đăng nhập/bảo mật thật). Entity read-only: chỉ getter.
 */
@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "code", length = 20, nullable = false)
    private String code;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "role", length = 30, nullable = false)
    private String role;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
}
