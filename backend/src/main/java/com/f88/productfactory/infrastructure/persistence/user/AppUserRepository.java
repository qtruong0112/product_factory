package com.f88.productfactory.infrastructure.persistence.user;

import com.f88.productfactory.domain.model.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
}
