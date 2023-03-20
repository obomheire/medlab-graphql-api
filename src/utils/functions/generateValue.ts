export const generateIncrementalValue = async ( db: any) : Promise<string> => {
    const mostRecent = await db
    .createQueryBuilder('entity')
    .orderBy('entity.createdAt', 'DESC')
    .getOne();
    
    let value = ''
    
    if (mostRecent === null) {
        return '000001'
    }
    value = mostRecent.unique.split('-')[1]
    
    const newValue = (parseInt(value) + 1).toString()
    return newValue.padStart(6, '0')
}