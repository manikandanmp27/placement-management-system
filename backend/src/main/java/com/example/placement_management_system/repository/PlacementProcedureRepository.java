package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Application;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface PlacementProcedureRepository
        extends Repository<Application, Integer> {

    @Procedure(procedureName = "ApplyForJob")
    void applyForJob(
            @Param("p_student_id") Integer studentId,
            @Param("p_job_id") Integer jobId
    );
}