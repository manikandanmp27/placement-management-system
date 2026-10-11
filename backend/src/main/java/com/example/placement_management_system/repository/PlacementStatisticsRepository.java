package com.example.placement_management_system.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PlacementStatisticsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Object[]> getStatistics(Integer departmentId) {
        StoredProcedureQuery query =
                entityManager.createStoredProcedureQuery(
                        "PlacementStatistics"
                );

        query.registerStoredProcedureParameter(
                "p_department_id",
                Integer.class,
                jakarta.persistence.ParameterMode.IN
        );

        query.setParameter("p_department_id", departmentId);

        return query.getResultList();
    }
}