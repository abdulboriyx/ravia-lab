export const measures = [
  { id: "aid", short: "H.R. 8034", title: "Supplemental assistance", date: "20 Apr 2024", chamber: "House", url: "https://clerk.house.gov/Votes/2024152", yes: 366, no: 58, other: 7, outcome: "Passed the House", explanation: "A YEA supported passage of supplemental Israel-related appropriations. This vote is separate from the later weapons-delivery bill." },
  { id: "delivery", short: "H.R. 8369", title: "Weapons deliveries", date: "16 May 2024", chamber: "House", url: "https://clerk.house.gov/Votes/2024217", yes: 224, no: 187, other: 19, outcome: "Passed the House", explanation: "A YEA supported passage of legislation seeking to prevent withholding and expedite delivery of defense articles and services to Israel. House passage alone does not mean enactment." },
  { id: "restriction", short: "S.J.Res. 111", title: "Arms-sale restriction", date: "20 Nov 2024", chamber: "Senate", url: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1182/vote_118_2_00292.htm", yes: 18, no: 79, other: 3, outcome: "Motion rejected", explanation: "This was a motion to discharge the arms-sale disapproval resolution from committee. YEA advanced the restriction; NAY opposed advancing it. It was not a final vote on the resolution." }
] as const;
export type MeasureId = typeof measures[number]["id"];
export const timeline = [
  { date: "Sep 2021", bill: "H.R. 5323", title: "Iron Dome funding", text: "DeLauro’s bill proposed emergency funding for Iron Dome replenishment.", url: "https://www.congress.gov/bill/117th-congress/house-bill/5323" },
  { date: "01 Nov 2023", bill: "H.R. 6126", title: "Supplemental proposal", text: "Granger introduced the supplemental appropriations proposal. The official record corrects the October 30 date in the notes.", url: "https://www.govinfo.gov/app/details/BILLS-118hr6126ih" },
  { date: "17 Apr 2024", bill: "H.R. 8034", title: "A new funding bill", text: "Cole introduced the bill with Calvert and Díaz-Balart as original cosponsors.", url: "https://www.govinfo.gov/app/details/BILLS-118hr8034ih" },
  { date: "14 May 2024", bill: "H.R. 8369", title: "Delivery legislation", text: "Calvert introduced legislation addressing the delivery of defense assistance.", url: "https://www.govinfo.gov/app/details/BILLS-118hr8369ih" },
  { date: "20 Nov 2024", bill: "S.J.Res. 111", title: "An attempt to restrict a sale", text: "The Senate rejected the motion to bring the disapproval resolution out of committee.", url: measures[2].url }
];
