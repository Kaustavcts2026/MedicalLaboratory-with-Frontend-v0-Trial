package com.cognizant.patient_service.controller;

import com.cognizant.patient_service.dto.PatientRequest;
import com.cognizant.patient_service.entity.Patient;
import com.cognizant.patient_service.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PostMapping("/addProfile")
    @PreAuthorize("hasAuthority('PATIENT')")
    public String CreateProfile(@Valid @RequestBody PatientRequest request, Authentication auth){
        return patientService.createProfile(auth.getName(), request);

    }

    @GetMapping("/profile")
    @PreAuthorize("hasAuthority('PATIENT')")
    public Patient getProfile(Authentication auth) {
        return patientService.getProfile(auth.getName());
    }

    @PutMapping("/updateProfile")
    @PreAuthorize("hasAuthority('PATIENT')")
    public String updateProfile(@Valid @RequestBody PatientRequest request, Authentication auth) {
        return patientService.updateProfile(auth.getName(), request);

    }

    // Internal endpoint — called by other services (e.g., Billing) to resolve patientId → Patient data
    @GetMapping("/by-id/{patientId}")
    @PreAuthorize("hasAnyAuthority('ADMIN','LAB_TECH')")
    public com.cognizant.patient_service.entity.Patient getPatientById(@PathVariable Long patientId) {
        return patientService.getPatientById(patientId);
    }
}