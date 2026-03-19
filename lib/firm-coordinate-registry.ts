export type FirmCoordinateRecord = {
  latitude: number
  longitude: number
  source: string
}

export const FIRM_COORDINATE_REGISTRY: Record<string, FirmCoordinateRecord> = {
  '5ac41132a14e4137b5da8c48cd5d8830': { latitude: -33.8688, longitude: 151.2093, source: 'registry:Tibra Sydney' },
  '83d382d437424a85925e223a0a38687c': { latitude: 52.3676, longitude: 4.9041, source: 'registry:Optiver Amsterdam' },
  '927618d5f2ad4770b4723cb13f8eee8c': { latitude: 51.5074, longitude: -0.1278, source: 'registry:G-Research London' },
  '581a9eadbea641b6a779cb89fae57d12': { latitude: 40.7128, longitude: -74.006, source: 'registry:Five Rings New York' },
  'e391028afca54e04a56e06ce0ae892e0': { latitude: 40.7128, longitude: -74.006, source: 'registry:Virtu Financial New York' },
  '5214276b18fa4d6fa0a2c0b3ab90f60f': { latitude: 39.9526, longitude: -75.1652, source: 'registry:SIG Philadelphia' },
  '73469a6351a14f0d994b5a92cf38e78f': { latitude: 41.8781, longitude: -87.6298, source: 'registry:DRW Chicago' },
  'f0bc53a301274ddaa5147a77e1c3f56c': { latitude: 40.7128, longitude: -74.006, source: 'registry:D. E. Shaw New York' },
  'ceeb907e350042a9a148fb8b8985da97': { latitude: 40.7128, longitude: -74.006, source: 'registry:Two Sigma New York' },
  '9b07784b606c4fe7a51c94c2ded6a09c': { latitude: 40.7128, longitude: -74.006, source: 'registry:Jane Street New York' },
  ff63d6e9bfd84191b8cca7937cbd6f4f: { latitude: 41.8781, longitude: -87.6298, source: 'registry:Topstep Chicago' },
  ec87dbfe946548d4899d5dadf6ffaa42: { latitude: 51.5074, longitude: -0.1278, source: 'registry:Maven Securities London' },
  '9fe75d6b11d24816b0251fb50b60d516': { latitude: 51.5074, longitude: -0.1278, source: 'registry:XTX Markets London' },
  '7226ecfed50b47f8ad8b55b8cc8ad5e6': { latitude: -33.8688, longitude: 151.2093, source: 'registry:VivCourt Sydney' },
  optivercom: { latitude: 52.3676, longitude: 4.9041, source: 'registry:Optiver Amsterdam' },
  gresearchcom: { latitude: 51.5074, longitude: -0.1278, source: 'registry:G-Research London' },
  fiveringscom: { latitude: 40.7128, longitude: -74.006, source: 'registry:Five Rings New York' },
  virtucom: { latitude: 40.7128, longitude: -74.006, source: 'registry:Virtu Financial New York' },
  sigcom: { latitude: 39.9526, longitude: -75.1652, source: 'registry:SIG Philadelphia' },
  drwcom: { latitude: 41.8781, longitude: -87.6298, source: 'registry:DRW Chicago' },
  deshawcom: { latitude: 40.7128, longitude: -74.006, source: 'registry:D. E. Shaw New York' },
  twosigmacom: { latitude: 40.7128, longitude: -74.006, source: 'registry:Two Sigma New York' },
  janestreetcom: { latitude: 40.7128, longitude: -74.006, source: 'registry:Jane Street New York' },
  topstepcom: { latitude: 41.8781, longitude: -87.6298, source: 'registry:Topstep Chicago' },
  tibracom: { latitude: -33.8688, longitude: 151.2093, source: 'registry:Tibra Sydney' },
  mavensecuritiescom: { latitude: 51.5074, longitude: -0.1278, source: 'registry:Maven Securities London' },
  xtxmarketscom: { latitude: 51.5074, longitude: -0.1278, source: 'registry:XTX Markets London' },
  vivcourtcomau: { latitude: -33.8688, longitude: 151.2093, source: 'registry:VivCourt Sydney' },
  the5erscom: { latitude: 32.1848, longitude: 34.8713, source: 'registry:The5ers Raanana' },
  citytradersimperiumcom: { latitude: 25.2048, longitude: 55.2708, source: 'registry:City Traders Imperium Dubai' },
  fundedelitecom: { latitude: 41.4676, longitude: 12.9037, source: 'registry:Funded Elite Latina' },
  novaproptraderscom: { latitude: 30.2672, longitude: -97.7431, source: 'registry:Nova Funding Austin' },
  fundingpipscom: { latitude: 25.2048, longitude: 55.2708, source: 'registry:Funding Pips Dubai' },
  fundednextcom: { latitude: 25.2048, longitude: 55.2708, source: 'registry:FundedNext Dubai' },
  alphacapitalgroupukcom: { latitude: 51.5074, longitude: -0.1278, source: 'registry:Alpha Capital Group London' },
  fxifycom: { latitude: 51.5074, longitude: -0.1278, source: 'registry:FXIFY London' },
}