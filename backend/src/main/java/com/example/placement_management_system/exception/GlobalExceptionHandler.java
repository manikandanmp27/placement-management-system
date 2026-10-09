
package com.example.placement_management_system.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<String> handleDatabaseException(
            DataAccessException exception) {

        String message = exception.getMostSpecificCause().getMessage();

        if (message != null &&
                message.toLowerCase().contains("already applied")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("You have already applied for this job.");
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("The request could not be completed. Check the supplied data and eligibility.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(
            Exception exception) {

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An unexpected error occurred.");
    }
}
