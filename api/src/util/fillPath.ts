import computeDistance from './computeDistance';

const fillPath = (start, end) => {
  if (computeDistance(start, end) > 25) {
    const middle = {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2,
    };
    return [...fillPath(start, middle), middle, ...fillPath(middle, end)];
  }
  return [];
};

export default fillPath;
