import { format } from 'date-fns';

export function getPickupDateString(): string {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    let pickupDate = new Date(today);
    let pickupDayString = '';

    // Logic: Pickup on Wed for orders Sun-Wed, pickup on Sat for orders Thu-Sat.
    if (currentDay >= 0 && currentDay <= 3) { // Sunday, Monday, Tuesday, Wednesday
      const daysToAdd = (3 - currentDay + 7) % 7;
      pickupDate.setDate(today.getDate() + daysToAdd);
      pickupDayString = 'Wednesday';
    } else { // Thursday, Friday, Saturday
      const daysToAdd = (6 - currentDay + 7) % 7;
      pickupDate.setDate(today.getDate() + daysToAdd);
      pickupDayString = 'Saturday';
    }
    
    return `${pickupDayString}, ${format(pickupDate, 'MMMM d')}`;
}
