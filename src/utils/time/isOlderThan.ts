/**
 * 
 * @param interval the time interval to check against
 */
const isOlderThan = (date: Date, interval:'day'|'week'|'month'|'year') : boolean => {

    const day = 86400000
    const intervals : Record<string, number> = {
        day,
        week : day * 7,
        month : day * 30,
        year : day * 365
    } 

    const parsedDate = new Date(date).getTime()
    const now = Date.now()
    return parsedDate + intervals[interval] < now    
}

export default isOlderThan