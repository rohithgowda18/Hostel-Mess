package com.hostel.mess.service;

import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.hostel.mess.exception.BadRequestException;

import static org.junit.jupiter.api.Assertions.*;

public class MealTimeWindowTest {

    private MealService mealService;

    @BeforeEach
    void setUp() {
        mealService = new MealService();
    }

    @Test
    @DisplayName("07:00 -> No active meal")
    void test0700NoActiveMeal() {
        String active = mealService.getActiveMealTypeAt(LocalTime.of(7, 0));
        assertNull(active, "At 07:00 there should be no active meal");
    }

    @Test
    @DisplayName("07:30 -> Breakfast active")
    void test0730BreakfastActive() {
        String active = mealService.getActiveMealTypeAt(LocalTime.of(7, 30));
        assertEquals("BREAKFAST", active, "At 07:30 Breakfast should become active");
    }

    @Test
    @DisplayName("08:00 -> Breakfast active, reports allowed, lunch rejected")
    void test0800BreakfastActiveAndReportValidation() {
        LocalTime time = LocalTime.of(8, 0);
        String active = mealService.getActiveMealTypeAt(time);
        assertEquals("BREAKFAST", active);

        // Breakfast report succeeds (no exception)
        assertDoesNotThrow(() -> mealService.validateActiveMealAt("BREAKFAST", "reporting", time));

        // Lunch report rejected
        BadRequestException reportEx = assertThrows(BadRequestException.class, () ->
                mealService.validateActiveMealAt("LUNCH", "reporting", time)
        );
        assertEquals("Lunch reporting is closed. Breakfast is currently being served.", reportEx.getMessage());

        // Lunch photo upload rejected
        BadRequestException photoEx = assertThrows(BadRequestException.class, () ->
                mealService.validateActiveMealAt("LUNCH", "photo upload", time)
        );
        assertEquals("Lunch photo upload is closed. Breakfast is currently being served.", photoEx.getMessage());
    }

    @Test
    @DisplayName("09:29 -> Breakfast still active")
    void test0929BreakfastActive() {
        String active = mealService.getActiveMealTypeAt(LocalTime.of(9, 29, 59));
        assertEquals("BREAKFAST", active, "At 09:29:59 Breakfast should still be active");
    }

    @Test
    @DisplayName("09:30 -> Breakfast closed exactly at 09:30")
    void test0930BreakfastClosed() {
        String active = mealService.getActiveMealTypeAt(LocalTime.of(9, 30));
        assertNull(active, "At 09:30 Breakfast must be closed");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                mealService.validateActiveMealAt("BREAKFAST", "reporting", LocalTime.of(9, 30))
        );
        assertEquals("No meal is currently being served. Reporting is closed.", ex.getMessage());
    }

    @Test
    @DisplayName("13:00 -> Lunch active")
    void test1300LunchActive() {
        LocalTime time = LocalTime.of(13, 0);
        assertEquals("LUNCH", mealService.getActiveMealTypeAt(time));

        assertDoesNotThrow(() -> mealService.validateActiveMealAt("LUNCH", "reporting", time));
        assertDoesNotThrow(() -> mealService.validateActiveMealAt("LUNCH", "photo upload", time));

        // Breakfast report rejected
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                mealService.validateActiveMealAt("BREAKFAST", "reporting", time)
        );
        assertEquals("Breakfast reporting is closed. Lunch is currently being served.", ex.getMessage());
    }

    @Test
    @DisplayName("14:30 -> Lunch closed")
    void test1430LunchClosed() {
        assertNull(mealService.getActiveMealTypeAt(LocalTime.of(14, 30)));
    }

    @Test
    @DisplayName("17:00 -> Snacks active")
    void test1700SnacksActive() {
        LocalTime time = LocalTime.of(17, 0);
        assertEquals("SNACKS", mealService.getActiveMealTypeAt(time));
        assertDoesNotThrow(() -> mealService.validateActiveMealAt("SNACKS", "reporting", time));
    }

    @Test
    @DisplayName("17:30 -> Snacks closed")
    void test1730SnacksClosed() {
        assertNull(mealService.getActiveMealTypeAt(LocalTime.of(17, 30)));
    }

    @Test
    @DisplayName("20:00 -> Dinner active")
    void test2000DinnerActive() {
        LocalTime time = LocalTime.of(20, 0);
        assertEquals("DINNER", mealService.getActiveMealTypeAt(time));
        assertDoesNotThrow(() -> mealService.validateActiveMealAt("DINNER", "reporting", time));
    }

    @Test
    @DisplayName("21:30 -> Dinner closed")
    void test2130DinnerClosed() {
        assertNull(mealService.getActiveMealTypeAt(LocalTime.of(21, 30)));
    }

    @Test
    @DisplayName("22:00 -> Dinner closed, no active meal")
    void test2200DinnerClosed() {
        LocalTime time = LocalTime.of(22, 0);
        assertNull(mealService.getActiveMealTypeAt(time));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                mealService.validateActiveMealAt("DINNER", "reporting", time)
        );
        assertEquals("No meal is currently being served. Reporting is closed.", ex.getMessage());
    }
}
