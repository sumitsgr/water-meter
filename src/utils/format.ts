import { default as dayjs } from 'dayjs';

export const formatDate = (date?: number | string | Date | null) => {
  if (!date) return '-';

  return dayjs(date).format('MMMM D, YYYY h:mm A');
};
