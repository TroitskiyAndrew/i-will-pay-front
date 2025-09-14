export function getDateString(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`
}

export function getDate(dateStr: string): string {
  let date = new Date();
  if(dateStr){
    const [day, month, year] = dateStr.split('/').map(n => Number(n))
    date = new Date(year, month - 1, day)
  }
  return date.toISOString().substring(0, 10);
}
