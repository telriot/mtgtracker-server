/**
 * 
 * @param array the array to chunk out
 * @param size the size of each chunk
 * @returns an array of chunks with max size equal to size param
 */
const chunkArr= (array: any[], size:number) =>
{
    const chunks = []
    for (let i=0, j=array.length; i<j; i+=size) {
        chunks.push(array.slice(i,i+size))
    }
    return chunks
}
