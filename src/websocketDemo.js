src/hooks/useMarketFeed.js


useMarketFeed({
  accessToken,
  clientCode,
  scrips: [
    {
      Exch: "N",
      ExchType: "C",
      ScripCode: 3045
    }
  ],
  onData: (data) => {
    console.log(data);
  }
});