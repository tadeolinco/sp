const timeMe = async callback => {
  console.log('Timing now');
  const startTime = new Date().getTime();

  await callback();

  const totalTime = (new Date().getTime() - startTime) / 1000;
  console.log(`Total time: ${totalTime} seconds.`);
};

export default timeMe;
