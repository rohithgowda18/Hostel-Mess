package com.hostel.mess.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Map;

@Document(collection = "weekly_menus")
public class WeeklyMenu {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String weekStartDate; // YYYY-MM-DD (typically a Monday)
    
    // Day Menu Maps: e.g., {"BREAKFAST": ["Idli", "Vada"], "LUNCH": ["Rice", "Sambar"]}
    private Map<String, List<String>> monday;
    private Map<String, List<String>> tuesday;
    private Map<String, List<String>> wednesday;
    private Map<String, List<String>> thursday;
    private Map<String, List<String>> friday;
    private Map<String, List<String>> saturday;
    private Map<String, List<String>> sunday;

    public WeeklyMenu() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getWeekStartDate() { return weekStartDate; }
    public void setWeekStartDate(String weekStartDate) { this.weekStartDate = weekStartDate; }

    public Map<String, List<String>> getMonday() { return monday; }
    public void setMonday(Map<String, List<String>> monday) { this.monday = monday; }

    public Map<String, List<String>> getTuesday() { return tuesday; }
    public void setTuesday(Map<String, List<String>> tuesday) { this.tuesday = tuesday; }

    public Map<String, List<String>> getWednesday() { return wednesday; }
    public void setWednesday(Map<String, List<String>> wednesday) { this.wednesday = wednesday; }

    public Map<String, List<String>> getThursday() { return thursday; }
    public void setThursday(Map<String, List<String>> thursday) { this.thursday = thursday; }

    public Map<String, List<String>> getFriday() { return friday; }
    public void setFriday(Map<String, List<String>> friday) { this.friday = friday; }

    public Map<String, List<String>> getSaturday() { return saturday; }
    public void setSaturday(Map<String, List<String>> saturday) { this.saturday = saturday; }

    public Map<String, List<String>> getSunday() { return sunday; }
    public void setSunday(Map<String, List<String>> sunday) { this.sunday = sunday; }
}
