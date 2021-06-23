/**
 * 
 * @param array the array to chunk out
 * @param size the size of each chunk
 * @returns an array of chunks with max size equal to size param
 */
const chunkArr = <T>(array: T[], size:number): T[][] =>
{
    if(!Array.isArray(array) || !size || typeof size !=='number') 
    {
        console.error('Incorrect arguments to chunk.ts function')
        return []
    }
    const chunks = []
    for (let i=0, j=array.length; i<j; i+=size) {
        chunks.push(array.slice(i,i+size))
    }
    return chunks
}


export default chunkArr