package com.cognizant.patient_service.service;

import com.cognizant.patient_service.dto.PatientRequest;
import com.cognizant.patient_service.entity.Patient;
import com.cognizant.patient_service.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    public String createProfile(String username, PatientRequest request){
        if(patientRepository.findByUsername(username).isPresent()){
            return "Profile already exists for this user.";
        }

        Patient patient = new Patient();
        patient.setUsername(username);
        patient.setFirstname(request.getFirstName());
        patient.setLastname(request.getLastName());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhoneNumber());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setCreatedAt(LocalDateTime.now());

        patientRepository.save(patient);

        return "Profile created successfully.";
    }

    public Patient getProfile(String username){
        return patientRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + username));
    }

    // Internal service call — used by Billing Service to resolve patientId → username for notifications
    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
    }

    public String updateProfile(String username, PatientRequest request){
        Patient patient = patientRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + username));

        patient.setFirstname(request.getFirstName());
        patient.setLastname(request.getLastName());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhoneNumber());
        patient.setEmail(request.getEmail());
        patient.setAddress(request.getAddress());
        patient.setUpdatedAt(LocalDateTime.now());

        patientRepository.save(patient);

        return "Profile updated successfully.";
    }
}
