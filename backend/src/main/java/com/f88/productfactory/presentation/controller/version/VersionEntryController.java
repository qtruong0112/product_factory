package com.f88.productfactory.presentation.controller.version;

import com.f88.productfactory.application.service.version.VersionEntryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/version-entries")
public class VersionEntryController {

    private final VersionEntryService service;

    public VersionEntryController(VersionEntryService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam String entityType, @RequestParam String entityCode) {
        return service.list(entityType, entityCode);
    }
}
