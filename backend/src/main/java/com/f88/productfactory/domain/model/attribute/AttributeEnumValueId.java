package com.f88.productfactory.domain.model.attribute;

import java.io.Serializable;
import java.util.Objects;

/** Khóa ghép attribute_enum_value (attribute_code, sort_order). */
public class AttributeEnumValueId implements Serializable {
    private String attributeCode;
    private Short sortOrder;

    public AttributeEnumValueId() {}

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AttributeEnumValueId that)) return false;
        return Objects.equals(attributeCode, that.attributeCode)
                && Objects.equals(sortOrder, that.sortOrder);
    }
    @Override public int hashCode() { return Objects.hash(attributeCode, sortOrder); }
}
