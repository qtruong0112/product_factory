package com.f88.productfactory.presentation.controller.user;

import com.f88.productfactory.domain.model.user.AppUser;
import com.f88.productfactory.infrastructure.persistence.user.AppUserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Danh sách người dùng thật cho bộ chọn "đổi vai trò" ở sidebar (Giai đoạn 42) — thuần đọc,
 * trả nguyên danh sách (không phân trang, chỉ ~6 dòng).
 */
@RestController
@RequestMapping("/api/users")
public class AppUserController {

    private final AppUserRepository repo;

    public AppUserController(AppUserRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<AppUser> list() {
        return repo.findAll();
    }
}
