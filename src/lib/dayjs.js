import dayjs from 'dayjs';

export const formatTimestamp = (ts) => dayjs(ts).format('YYYY-MM-DD HH:mm');

export const formatDate = (ts) => dayjs(ts).format('YYYY-MM-DD');
