package com.f88.productfactory.structure;

import com.f88.productfactory.common.ReadOnlyController;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data-types")
public class DataTypeController extends ReadOnlyController<DataType, String> {

    private final DataTypeRepository repo;

    public DataTypeController(DataTypeRepository repo) {
        this.repo = repo;
    }

    @Override
    protected JpaRepository<DataType, String> repository() {
        return repo;
    }
}
