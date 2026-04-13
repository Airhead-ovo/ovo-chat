export const formatTime = (created: number) => {
  return new Date(created * 1000).toLocaleString();
}