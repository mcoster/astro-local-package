#!/usr/bin/env node
/**
 * Generate proper suburbs.json with correct Adelaide suburb data
 * This creates a clean, consistent suburbs file with real postcodes
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Center point: Kilburn, SA (from business address)
const CENTER_LAT = -34.8517;
const CENTER_LNG = 138.5829;
const RADIUS_KM = 50;

// Define proper Adelaide suburbs with correct postcodes
// These are actual SA suburbs with verified postcodes
const ADELAIDE_SUBURBS = [
  // Inner Adelaide
  { name: 'Adelaide', postcode: '5000', lat: -34.9285, lng: 138.6007 },
  { name: 'North Adelaide', postcode: '5006', lat: -34.9065, lng: 138.5930 },
  { name: 'Kent Town', postcode: '5067', lat: -34.9211, lng: 138.6206 },
  { name: 'Hackney', postcode: '5069', lat: -34.9167, lng: 138.6167 },
  { name: 'St Peters', postcode: '5069', lat: -34.9054, lng: 138.6213 },
  { name: 'Maylands', postcode: '5069', lat: -34.9180, lng: 138.6274 },
  { name: 'Stepney', postcode: '5069', lat: -34.9148, lng: 138.6232 },
  { name: 'College Park', postcode: '5069', lat: -34.9111, lng: 138.6198 },
  
  // Inner North
  { name: 'Prospect', postcode: '5082', lat: -34.8833, lng: 138.5945 },
  { name: 'Kilburn', postcode: '5084', lat: -34.8597, lng: 138.5856 },
  { name: 'Blair Athol', postcode: '5084', lat: -34.8592, lng: 138.5965 },
  { name: 'Enfield', postcode: '5085', lat: -34.8480, lng: 138.6050 },
  { name: 'Clearview', postcode: '5085', lat: -34.8409, lng: 138.6083 },
  { name: 'Northfield', postcode: '5085', lat: -34.8445, lng: 138.6230 },
  { name: 'Lightsview', postcode: '5085', lat: -34.8372, lng: 138.6167 },
  { name: 'Sefton Park', postcode: '5083', lat: -34.8726, lng: 138.6008 },
  { name: 'Nailsworth', postcode: '5083', lat: -34.8780, lng: 138.6050 },
  { name: 'Broadview', postcode: '5083', lat: -34.8667, lng: 138.6000 },
  { name: 'Medindie', postcode: '5081', lat: -34.8917, lng: 138.6083 },
  { name: 'Medindie Gardens', postcode: '5081', lat: -34.8950, lng: 138.6117 },
  { name: 'Thorngate', postcode: '5082', lat: -34.8917, lng: 138.5967 },
  { name: 'Fitzroy', postcode: '5082', lat: -34.8880, lng: 138.5990 },
  { name: 'Ovingham', postcode: '5082', lat: -34.8900, lng: 138.5900 },
  { name: 'Walkerville', postcode: '5081', lat: -34.8933, lng: 138.6150 },
  { name: 'Vale Park', postcode: '5081', lat: -34.8883, lng: 138.6200 },
  { name: 'Gilberton', postcode: '5081', lat: -34.8983, lng: 138.6117 },
  { name: 'Collinswood', postcode: '5081', lat: -34.8850, lng: 138.6083 },
  
  // Inner West
  { name: 'Hindmarsh', postcode: '5007', lat: -34.9080, lng: 138.5700 },
  { name: 'Brompton', postcode: '5007', lat: -34.8990, lng: 138.5780 },
  { name: 'Bowden', postcode: '5007', lat: -34.9025, lng: 138.5750 },
  { name: 'Welland', postcode: '5007', lat: -34.8917, lng: 138.5633 },
  { name: 'West Hindmarsh', postcode: '5007', lat: -34.9080, lng: 138.5650 },
  { name: 'Croydon', postcode: '5008', lat: -34.8975, lng: 138.5650 },
  { name: 'West Croydon', postcode: '5008', lat: -34.8975, lng: 138.5550 },
  { name: 'Croydon Park', postcode: '5008', lat: -34.8875, lng: 138.5600 },
  { name: 'Devon Park', postcode: '5008', lat: -34.8850, lng: 138.5700 },
  { name: 'Dudley Park', postcode: '5008', lat: -34.8800, lng: 138.5650 },
  { name: 'Renown Park', postcode: '5008', lat: -34.8917, lng: 138.5667 },
  { name: 'Ridleyton', postcode: '5008', lat: -34.8950, lng: 138.5600 },
  { name: 'Allenby Gardens', postcode: '5009', lat: -34.9000, lng: 138.5500 },
  { name: 'Beverley', postcode: '5009', lat: -34.8867, lng: 138.5467 },
  { name: 'Kilkenny', postcode: '5009', lat: -34.8750, lng: 138.5500 },
  
  // North West
  { name: 'Angle Park', postcode: '5010', lat: -34.8550, lng: 138.5650 },
  { name: 'Ferryden Park', postcode: '5010', lat: -34.8467, lng: 138.5550 },
  { name: 'Regency Park', postcode: '5010', lat: -34.8583, lng: 138.5717 },
  { name: 'Woodville', postcode: '5011', lat: -34.8833, lng: 138.5417 },
  { name: 'Woodville South', postcode: '5011', lat: -34.8917, lng: 138.5417 },
  { name: 'Woodville Park', postcode: '5011', lat: -34.8750, lng: 138.5417 },
  { name: 'Woodville West', postcode: '5011', lat: -34.8833, lng: 138.5317 },
  { name: 'St Clair', postcode: '5011', lat: -34.8700, lng: 138.5350 },
  { name: 'Woodville North', postcode: '5012', lat: -34.8667, lng: 138.5417 },
  { name: 'Woodville Gardens', postcode: '5012', lat: -34.8583, lng: 138.5400 },
  { name: 'Mansfield Park', postcode: '5012', lat: -34.8500, lng: 138.5450 },
  { name: 'Athol Park', postcode: '5012', lat: -34.8417, lng: 138.5383 },
  { name: 'Cheltenham', postcode: '5014', lat: -34.8667, lng: 138.5233 },
  { name: 'Albert Park', postcode: '5014', lat: -34.8700, lng: 138.5150 },
  { name: 'Alberton', postcode: '5014', lat: -34.8583, lng: 138.5150 },
  { name: 'Queenstown', postcode: '5014', lat: -34.8550, lng: 138.5100 },
  { name: 'Royal Park', postcode: '5014', lat: -34.8650, lng: 138.5050 },
  { name: 'Hendon', postcode: '5014', lat: -34.8750, lng: 138.5000 },
  { name: 'Pennington', postcode: '5013', lat: -34.8417, lng: 138.5283 },
  { name: 'Ottoway', postcode: '5013', lat: -34.8350, lng: 138.5317 },
  { name: 'Rosewater', postcode: '5013', lat: -34.8283, lng: 138.5283 },
  { name: 'Wingfield', postcode: '5013', lat: -34.8350, lng: 138.5450 },
  { name: 'Gillman', postcode: '5013', lat: -34.8200, lng: 138.5150 },
  
  // Port Adelaide area
  { name: 'Port Adelaide', postcode: '5015', lat: -34.8477, lng: 138.5016 },
  { name: 'Birkenhead', postcode: '5015', lat: -34.8350, lng: 138.4950 },
  { name: 'Peterhead', postcode: '5016', lat: -34.8417, lng: 138.4867 },
  { name: 'Largs Bay', postcode: '5016', lat: -34.8250, lng: 138.4917 },
  { name: 'Largs North', postcode: '5016', lat: -34.8167, lng: 138.4950 },
  { name: 'Taperoo', postcode: '5017', lat: -34.8083, lng: 138.4983 },
  { name: 'Osborne', postcode: '5017', lat: -34.7950, lng: 138.4917 },
  { name: 'North Haven', postcode: '5018', lat: -34.7883, lng: 138.4950 },
  { name: 'Outer Harbor', postcode: '5018', lat: -34.7817, lng: 138.4883 },
  { name: 'Semaphore', postcode: '5019', lat: -34.8392, lng: 138.4781 },
  { name: 'Semaphore Park', postcode: '5019', lat: -34.8517, lng: 138.4750 },
  { name: 'Semaphore South', postcode: '5019', lat: -34.8583, lng: 138.4733 },
  { name: 'West Lakes Shore', postcode: '5020', lat: -34.8717, lng: 138.4867 },
  { name: 'West Lakes', postcode: '5021', lat: -34.8750, lng: 138.4950 },
  
  // Western beaches
  { name: 'Grange', postcode: '5022', lat: -34.9000, lng: 138.4883 },
  { name: 'Henley Beach', postcode: '5022', lat: -34.9159, lng: 138.4931 },
  { name: 'Henley Beach South', postcode: '5022', lat: -34.9250, lng: 138.4917 },
  { name: 'Tennyson', postcode: '5022', lat: -34.8883, lng: 138.4950 },
  { name: 'Seaton', postcode: '5023', lat: -34.8950, lng: 138.5050 },
  { name: 'Findon', postcode: '5023', lat: -34.9017, lng: 138.5317 },
  { name: 'West Beach', postcode: '5024', lat: -34.9417, lng: 138.5083 },
  { name: 'Fulham', postcode: '5024', lat: -34.9167, lng: 138.5117 },
  { name: 'Fulham Gardens', postcode: '5024', lat: -34.9117, lng: 138.5050 },
  { name: 'Kidman Park', postcode: '5025', lat: -34.9083, lng: 138.5267 },
  { name: 'Flinders Park', postcode: '5025', lat: -34.9033, lng: 138.5450 },
  { name: 'Lockleys', postcode: '5032', lat: -34.9167, lng: 138.5383 },
  { name: 'Underdale', postcode: '5032', lat: -34.9217, lng: 138.5467 },
  { name: 'Brooklyn Park', postcode: '5032', lat: -34.9300, lng: 138.5400 },
  
  // Inner South West
  { name: 'Thebarton', postcode: '5031', lat: -34.9150, lng: 138.5717 },
  { name: 'Torrensville', postcode: '5031', lat: -34.9183, lng: 138.5617 },
  { name: 'Mile End', postcode: '5031', lat: -34.9217, lng: 138.5683 },
  { name: 'Mile End South', postcode: '5031', lat: -34.9283, lng: 138.5650 },
  { name: 'Richmond', postcode: '5033', lat: -34.9367, lng: 138.5617 },
  { name: 'Marleston', postcode: '5033', lat: -34.9417, lng: 138.5550 },
  { name: 'Cowandilla', postcode: '5033', lat: -34.9333, lng: 138.5467 },
  { name: 'West Richmond', postcode: '5033', lat: -34.9367, lng: 138.5517 },
  { name: 'Hilton', postcode: '5033', lat: -34.9333, lng: 138.5617 },
  { name: 'Keswick', postcode: '5035', lat: -34.9450, lng: 138.5817 },
  { name: 'Keswick Terminal', postcode: '5035', lat: -34.9467, lng: 138.5800 },
  { name: 'Black Forest', postcode: '5035', lat: -34.9517, lng: 138.5750 },
  
  // Northern suburbs (closer ones)
  { name: 'Cavan', postcode: '5094', lat: -34.8217, lng: 138.5783 },
  { name: 'Dry Creek', postcode: '5094', lat: -34.8133, lng: 138.5917 },
  { name: 'Gepps Cross', postcode: '5094', lat: -34.8250, lng: 138.6083 },
  { name: 'Mawson Lakes', postcode: '5095', lat: -34.8083, lng: 138.6083 },
  { name: 'Pooraka', postcode: '5095', lat: -34.8217, lng: 138.6217 },
  { name: 'Ingle Farm', postcode: '5098', lat: -34.8283, lng: 138.6417 },
  { name: 'Walkley Heights', postcode: '5098', lat: -34.8183, lng: 138.6500 },
  { name: 'Para Hills', postcode: '5096', lat: -34.8050, lng: 138.6583 },
  { name: 'Para Hills West', postcode: '5096', lat: -34.8050, lng: 138.6417 },
  { name: 'Gulfview Heights', postcode: '5096', lat: -34.7950, lng: 138.6667 },
  { name: 'Para Vista', postcode: '5093', lat: -34.8183, lng: 138.6083 },
  { name: 'Valley View', postcode: '5093', lat: -34.8317, lng: 138.6317 },
  
  // North East
  { name: 'Northgate', postcode: '5085', lat: -34.8483, lng: 138.6283 },
  { name: 'Oakden', postcode: '5086', lat: -34.8550, lng: 138.6383 },
  { name: 'Greenacres', postcode: '5086', lat: -34.8683, lng: 138.6250 },
  { name: 'Hillcrest', postcode: '5086', lat: -34.8617, lng: 138.6417 },
  { name: 'Manningham', postcode: '5086', lat: -34.8550, lng: 138.6317 },
  { name: 'Gilles Plains', postcode: '5086', lat: -34.8483, lng: 138.6450 },
  { name: 'Hampstead Gardens', postcode: '5086', lat: -34.8717, lng: 138.6350 },
  { name: 'Klemzig', postcode: '5087', lat: -34.8783, lng: 138.6383 },
  { name: 'Windsor Gardens', postcode: '5087', lat: -34.8650, lng: 138.6517 },
  { name: 'Holden Hill', postcode: '5088', lat: -34.8550, lng: 138.6583 },
  { name: 'Highbury', postcode: '5089', lat: -34.8483, lng: 138.6750 },
  { name: 'Hope Valley', postcode: '5090', lat: -34.8417, lng: 138.6983 },
  { name: 'Tea Tree Gully', postcode: '5091', lat: -34.8250, lng: 138.7017 },
  { name: 'Vista', postcode: '5091', lat: -34.8350, lng: 138.6917 },
  { name: 'Banksia Park', postcode: '5091', lat: -34.8150, lng: 138.7117 },
  { name: 'Modbury', postcode: '5092', lat: -34.8283, lng: 138.6817 },
  { name: 'Modbury North', postcode: '5092', lat: -34.8183, lng: 138.6850 },
  { name: 'Modbury Heights', postcode: '5092', lat: -34.8121, lng: 138.6939 },
  { name: 'St Agnes', postcode: '5097', lat: -34.8283, lng: 138.7117 },
  { name: 'Ridgehaven', postcode: '5097', lat: -34.8183, lng: 138.7017 },
  { name: 'Redwood Park', postcode: '5097', lat: -34.8000, lng: 138.7167 },
  
  // Eastern suburbs
  { name: 'Royston Park', postcode: '5070', lat: -34.8983, lng: 138.6317 },
  { name: 'Joslin', postcode: '5070', lat: -34.9017, lng: 138.6283 },
  { name: 'Marden', postcode: '5070', lat: -34.9083, lng: 138.6383 },
  { name: 'Felixstow', postcode: '5070', lat: -34.9017, lng: 138.6450 },
  { name: 'Glynde', postcode: '5070', lat: -34.8917, lng: 138.6500 },
  { name: 'Payneham', postcode: '5070', lat: -34.8950, lng: 138.6417 },
  { name: 'Firle', postcode: '5070', lat: -34.9050, lng: 138.6550 },
  { name: 'Kensington', postcode: '5068', lat: -34.9217, lng: 138.6417 },
  { name: 'Kensington Park', postcode: '5068', lat: -34.9183, lng: 138.6350 },
  { name: 'Kensington Gardens', postcode: '5068', lat: -34.9250, lng: 138.6417 },
  { name: 'Trinity Gardens', postcode: '5068', lat: -34.9150, lng: 138.6450 },
  { name: 'St Morris', postcode: '5068', lat: -34.9117, lng: 138.6383 },
  { name: 'Leabrook', postcode: '5068', lat: -34.9283, lng: 138.6350 },
  { name: 'Norwood', postcode: '5067', lat: -34.9217, lng: 138.6283 },
  { name: 'Rose Park', postcode: '5067', lat: -34.9317, lng: 138.6217 },
  { name: 'Campbelltown', postcode: '5074', lat: -34.8817, lng: 138.6617 },
  { name: 'Newton', postcode: '5074', lat: -34.8750, lng: 138.6783 },
  { name: 'Paradise', postcode: '5075', lat: -34.8917, lng: 138.6667 },
  { name: 'Dernancourt', postcode: '5075', lat: -34.8683, lng: 138.6717 },
  { name: 'Athelstone', postcode: '5076', lat: -34.8750, lng: 138.6983 },
  { name: 'Tranmere', postcode: '5073', lat: -34.9017, lng: 138.6683 },
  { name: 'Rostrevor', postcode: '5073', lat: -34.8983, lng: 138.6850 },
  { name: 'Magill', postcode: '5072', lat: -34.9117, lng: 138.6750 },
  { name: 'Woodforde', postcode: '5072', lat: -34.9183, lng: 138.6917 },
  { name: 'Rosslyn Park', postcode: '5072', lat: -34.9317, lng: 138.6583 },
  { name: 'Auldana', postcode: '5072', lat: -34.9250, lng: 138.6650 },
  { name: 'Skye', postcode: '5072', lat: -34.9283, lng: 138.6750 },
  { name: 'Teringie', postcode: '5072', lat: -34.9217, lng: 138.6817 },
  
  // Inner South
  { name: 'Wayville', postcode: '5034', lat: -34.9467, lng: 138.5917 },
  { name: 'Goodwood', postcode: '5034', lat: -34.9517, lng: 138.5917 },
  { name: 'Millswood', postcode: '5034', lat: -34.9567, lng: 138.5883 },
  { name: 'Kings Park', postcode: '5034', lat: -34.9550, lng: 138.5950 },
  { name: 'Clarence Park', postcode: '5034', lat: -34.9617, lng: 138.5817 },
  { name: 'Forestville', postcode: '5035', lat: -34.9550, lng: 138.5817 },
  { name: 'Everard Park', postcode: '5035', lat: -34.9583, lng: 138.5750 },
  { name: 'Ashford', postcode: '5035', lat: -34.9467, lng: 138.5750 },
  { name: 'Kurralta Park', postcode: '5037', lat: -34.9483, lng: 138.5650 },
  { name: 'Netley', postcode: '5037', lat: -34.9450, lng: 138.5517 },
  { name: 'North Plympton', postcode: '5037', lat: -34.9550, lng: 138.5550 },
  { name: 'Glandore', postcode: '5037', lat: -34.9617, lng: 138.5683 },
  { name: 'Plympton', postcode: '5038', lat: -34.9617, lng: 138.5550 },
  { name: 'Plympton Park', postcode: '5038', lat: -34.9683, lng: 138.5517 },
  { name: 'South Plympton', postcode: '5038', lat: -34.9750, lng: 138.5483 },
  { name: 'Camden Park', postcode: '5038', lat: -34.9717, lng: 138.5417 },
  { name: 'Novar Gardens', postcode: '5040', lat: -34.9750, lng: 138.5350 },
  { name: 'Morphettville', postcode: '5043', lat: -34.9846, lng: 138.5389 },
  { name: 'Park Holme', postcode: '5043', lat: -34.9817, lng: 138.5550 },
  { name: 'Ascot Park', postcode: '5043', lat: -34.9883, lng: 138.5617 },
  { name: 'Marion', postcode: '5043', lat: -34.9950, lng: 138.5550 },
  { name: 'Mitchell Park', postcode: '5043', lat: -35.0017, lng: 138.5617 },
  { name: 'Clovelly Park', postcode: '5042', lat: -35.0083, lng: 138.5750 },
  { name: 'Bedford Park', postcode: '5042', lat: -35.0183, lng: 138.5717 },
  { name: 'St Marys', postcode: '5042', lat: -35.0050, lng: 138.5883 },
  { name: 'Pasadena', postcode: '5042', lat: -34.9983, lng: 138.5917 },
  
  // Glenelg area
  { name: 'Glenelg', postcode: '5045', lat: -34.9799, lng: 138.5156 },
  { name: 'Glenelg East', postcode: '5045', lat: -34.9817, lng: 138.5250 },
  { name: 'Glenelg North', postcode: '5045', lat: -34.9717, lng: 138.5183 },
  { name: 'Glenelg South', postcode: '5045', lat: -34.9883, lng: 138.5117 },
  { name: 'Glengowrie', postcode: '5044', lat: -34.9883, lng: 138.5283 },
  { name: 'Somerton Park', postcode: '5044', lat: -34.9950, lng: 138.5217 },
  
  // Additional key suburbs
  { name: 'Golden Grove', postcode: '5125', lat: -34.7774, lng: 138.7068 },
  { name: 'Greenwith', postcode: '5125', lat: -34.7683, lng: 138.7050 },
  { name: 'Wynn Vale', postcode: '5127', lat: -34.7950, lng: 138.6917 },
  { name: 'Surrey Downs', postcode: '5126', lat: -34.8017, lng: 138.6750 },
  { name: 'Fairview Park', postcode: '5126', lat: -34.7983, lng: 138.7217 },
  { name: 'Salisbury', postcode: '5108', lat: -34.7600, lng: 138.6433 },
  { name: 'Salisbury North', postcode: '5108', lat: -34.7483, lng: 138.6450 },
  { name: 'Salisbury East', postcode: '5109', lat: -34.7650, lng: 138.6583 },
  { name: 'Salisbury South', postcode: '5106', lat: -34.7750, lng: 138.6350 },
  { name: 'Salisbury Downs', postcode: '5108', lat: -34.7517, lng: 138.6300 },
  { name: 'Elizabeth', postcode: '5112', lat: -34.7203, lng: 138.6705 },
  { name: 'Elizabeth North', postcode: '5113', lat: -34.7050, lng: 138.6750 },
  { name: 'Elizabeth South', postcode: '5112', lat: -34.7350, lng: 138.6650 },
  { name: 'Parafield', postcode: '5106', lat: -34.7883, lng: 138.6350 },
  { name: 'Parafield Gardens', postcode: '5107', lat: -34.7750, lng: 138.6083 },
  { name: 'Aberfoyle Park', postcode: '5159', lat: -35.0675, lng: 138.5964 },
  { name: 'Happy Valley', postcode: '5159', lat: -35.0833, lng: 138.5633 },
  { name: 'Flagstaff Hill', postcode: '5159', lat: -35.0550, lng: 138.5750 },
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLng = toLng - fromLng;
  const dLat = toLat - fromLat;
  
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  
  return directions[index];
}

async function generateProperSuburbs() {
  try {
    // Process all suburbs
    const processedSuburbs = ADELAIDE_SUBURBS.map((suburb, index) => {
      const distance = calculateDistance(CENTER_LAT, CENTER_LNG, suburb.lat, suburb.lng);
      const direction = calculateDirection(CENTER_LAT, CENTER_LNG, suburb.lat, suburb.lng);
      
      return {
        id: index + 1,
        name: suburb.name,
        postcode: suburb.postcode,
        state: 'SA',
        latitude: suburb.lat,
        longitude: suburb.lng,
        distanceKm: Math.round(distance * 100) / 100,
        direction,
        population: null // Can be added later if needed
      };
    });
    
    // Filter by radius and sort by distance
    const suburbsInRadius = processedSuburbs
      .filter(s => s.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    
    console.log(`Found ${suburbsInRadius.length} suburbs within ${RADIUS_KM}km`);
    
    // Create the final data structure
    const data = {
      generated: new Date().toISOString(),
      center: {
        lat: CENTER_LAT,
        lng: CENTER_LNG
      },
      radiusKm: RADIUS_KM,
      count: suburbsInRadius.length,
      suburbs: suburbsInRadius
    };
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'src', 'data', 'suburbs.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Generated suburbs.json with ${suburbsInRadius.length} suburbs`);
    console.log(`📁 Saved to: ${outputPath}`);
    
    // Show summary
    console.log('\nDistance breakdown:');
    console.log(`  0-10km: ${suburbsInRadius.filter(s => s.distanceKm <= 10).length} suburbs`);
    console.log(`  10-20km: ${suburbsInRadius.filter(s => s.distanceKm > 10 && s.distanceKm <= 20).length} suburbs`);
    console.log(`  20-30km: ${suburbsInRadius.filter(s => s.distanceKm > 20 && s.distanceKm <= 30).length} suburbs`);
    console.log(`  30-40km: ${suburbsInRadius.filter(s => s.distanceKm > 30 && s.distanceKm <= 40).length} suburbs`);
    console.log(`  40-50km: ${suburbsInRadius.filter(s => s.distanceKm > 40 && s.distanceKm <= 50).length} suburbs`);
    
  } catch (error) {
    console.error('❌ Error generating suburbs:', error);
    process.exit(1);
  }
}

// Run the generation
generateProperSuburbs();