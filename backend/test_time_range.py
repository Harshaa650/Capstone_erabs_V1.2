"""
Test script to verify time range filtering in get_available_slots function.
"""

from datetime import datetime, timedelta
from main import detect_conflict

def test_time_range_logic():
    """Test the time range logic manually"""
    
    # Simulate the logic from get_available_slots
    date_str = "2026-04-23"
    duration_minutes = 60
    start_time_str = "12:00"
    end_time_str = "15:00"
    
    # Parse date
    date = datetime.fromisoformat(date_str).date()
    
    # Simulate resource details
    resource_start = 8
    resource_end = 20
    
    # Parse time range
    search_start_hour, search_start_minute = map(int, start_time_str.split(":"))
    search_end_hour, search_end_minute = map(int, end_time_str.split(":"))
    
    # Ensure search range is within business hours
    search_start_hour = max(search_start_hour, resource_start)
    search_end_hour = min(search_end_hour, resource_end)
    
    print(f"Testing time range: {start_time_str} to {end_time_str}")
    print(f"Search range: {search_start_hour}:{search_start_minute:02d} to {search_end_hour}:{search_end_minute:02d}")
    print(f"Duration: {duration_minutes} minutes")
    print()
    
    available_slots = []
    
    # Generate slots every 30 minutes within the search range
    current_hour = search_start_hour
    current_minute = search_start_minute
    
    slot_count = 0
    while True:
        slot_count += 1
        if slot_count > 20:  # Safety break
            print("Safety break - too many iterations")
            break
            
        # Create slot start time
        slot_start = datetime.combine(date, datetime.min.time()).replace(
            hour=current_hour, minute=current_minute, tzinfo=None
        )
        slot_end = slot_start + timedelta(minutes=duration_minutes)
        
        print(f"Checking slot: {slot_start.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}")
        
        # Check if slot end exceeds search range
        search_end_time = datetime.combine(date, datetime.min.time()).replace(
            hour=search_end_hour, minute=search_end_minute, tzinfo=None
        )
        if slot_end > search_end_time:
            print(f"  ❌ Slot end ({slot_end.strftime('%H:%M')}) exceeds search range ({search_end_time.strftime('%H:%M')})")
            break
        
        # Check if slot end exceeds business hours
        if slot_end.hour > resource_end or (slot_end.hour == resource_end and slot_end.minute > 0):
            print(f"  ❌ Slot end exceeds business hours ({resource_end}:00)")
            break
        
        # For testing, assume no conflicts (would normally call detect_conflict)
        print(f"  ✅ Slot is valid")
        available_slots.append({
            "start": slot_start.strftime("%Y-%m-%d %H:%M"),
            "end": slot_end.strftime("%Y-%m-%d %H:%M"),
            "start_time": slot_start.strftime("%I:%M %p"),
            "end_time": slot_end.strftime("%I:%M %p")
        })
        
        # Move to next 30-minute slot
        current_minute += 30
        if current_minute >= 60:
            current_minute = 0
            current_hour += 1
        
        print(f"  Next slot will be: {current_hour}:{current_minute:02d}")
        
        # Stop if we've exceeded the search range
        if current_hour > search_end_hour:
            print(f"  ❌ Next hour ({current_hour}) exceeds search end ({search_end_hour})")
            break
        if current_hour == search_end_hour and current_minute >= search_end_minute:
            print(f"  ❌ Next time ({current_hour}:{current_minute:02d}) exceeds search end ({search_end_hour}:{search_end_minute:02d})")
            break
    
    print()
    print(f"Found {len(available_slots)} available slots:")
    for i, slot in enumerate(available_slots, 1):
        print(f"  {i}. {slot['start_time']} - {slot['end_time']}")
    
    return available_slots

def test_different_ranges():
    """Test different time ranges"""
    
    test_cases = [
        ("12:00", "15:00", 60),   # 12pm-3pm, 1-hour slots
        ("12:00", "15:00", 180),  # 12pm-3pm, 3-hour slots
        ("14:00", "17:00", 60),   # 2pm-5pm, 1-hour slots
        ("08:00", "12:00", 120),  # 8am-12pm, 2-hour slots
    ]
    
    for start_time, end_time, duration in test_cases:
        print("=" * 60)
        print(f"TEST: {start_time} to {end_time}, {duration} minutes")
        print("=" * 60)
        
        # Simulate the logic
        search_start_hour, search_start_minute = map(int, start_time.split(":"))
        search_end_hour, search_end_minute = map(int, end_time.split(":"))
        
        slots = []
        current_hour = search_start_hour
        current_minute = search_start_minute
        
        while True:
            slot_start_time = f"{current_hour:02d}:{current_minute:02d}"
            
            # Calculate slot end
            slot_start_dt = datetime.strptime(slot_start_time, "%H:%M")
            slot_end_dt = slot_start_dt + timedelta(minutes=duration)
            
            # Check if slot end exceeds range
            search_end_dt = datetime.strptime(f"{search_end_hour:02d}:{search_end_minute:02d}", "%H:%M")
            if slot_end_dt.time() > search_end_dt.time():
                break
            
            slots.append(f"{slot_start_time} - {slot_end_dt.strftime('%H:%M')}")
            
            # Move to next 30-minute slot
            current_minute += 30
            if current_minute >= 60:
                current_minute = 0
                current_hour += 1
            
            if current_hour > search_end_hour:
                break
            if current_hour == search_end_hour and current_minute >= search_end_minute:
                break
        
        print(f"Expected slots: {len(slots)}")
        for slot in slots:
            print(f"  - {slot}")
        print()

if __name__ == "__main__":
    print("Testing Time Range Logic")
    print("=" * 60)
    
    # Test the main case that was failing
    test_time_range_logic()
    
    print("\n" + "=" * 60)
    print("Testing Different Ranges")
    print("=" * 60)
    
    # Test different scenarios
    test_different_ranges()