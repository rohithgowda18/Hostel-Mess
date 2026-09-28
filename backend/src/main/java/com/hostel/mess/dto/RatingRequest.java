package com.hostel.mess.dto;

import java.util.List;

public class RatingRequest {
    private String mealType;
    private String date;
    private int ratingOverall;
    private int ratingTaste;
    private int ratingHygiene;
    private int ratingQuantity;
    private String review;
    private List<String> likedItems;
    private List<String> dislikedItems;

    public RatingRequest() {}

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public int getRatingOverall() { return ratingOverall; }
    public void setRatingOverall(int ratingOverall) { this.ratingOverall = ratingOverall; }

    public int getRatingTaste() { return ratingTaste; }
    public void setRatingTaste(int ratingTaste) { this.ratingTaste = ratingTaste; }

    public int getRatingHygiene() { return ratingHygiene; }
    public void setRatingHygiene(int ratingHygiene) { this.ratingHygiene = ratingHygiene; }

    public int getRatingQuantity() { return ratingQuantity; }
    public void setRatingQuantity(int ratingQuantity) { this.ratingQuantity = ratingQuantity; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public List<String> getLikedItems() { return likedItems; }
    public void setLikedItems(List<String> likedItems) { this.likedItems = likedItems; }

    public List<String> getDislikedItems() { return dislikedItems; }
    public void setDislikedItems(List<String> dislikedItems) { this.dislikedItems = dislikedItems; }
}
