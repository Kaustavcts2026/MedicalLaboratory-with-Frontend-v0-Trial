package com.medlab.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddInventoryItemRequest {

    @NotBlank(message = "Item name is required")
    private String itemName;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    @NotBlank(message = "Unit is required")
    private String unit;

    private String description;

    private Integer lowStockThreshold;
}
