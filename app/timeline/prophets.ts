type Prophet = {
  id: string;
  name: string;
  arabic: string;
  title: string;
  account: string;
  placement: string;
  verses: string[];
  hadith?: number[];
};

type Era = {
  id: string;
  title: string;
  note: string;
  prophets: Prophet[];
};

export const eras: Era[] = [
  {
    id: "final-mission",
    title: "The final mission",
    note: "Muhammad ﷺ is the endpoint of prophethood. The timeline begins here and moves backward.",
    prophets: [
      {
        id: "muhammad", name: "Muhammad", arabic: "محمد",
        title: "The Seal of the Prophets",
        account: "The Qur’an names Muhammad as Allah’s messenger and the Seal of the Prophets. In al-Bukhari’s account of the first revelation at Hira, the angel commands him to recite, and Khadijah reassures him by recalling his care for relatives, guests, and people in distress. The Qur’an describes his mission as a mercy to the worlds and recounts Allah’s protection during the migration, when he and a companion took refuge in a cave.",
        placement: "Ibn Abbas reports that revelation began at age forty, followed by thirteen years in Makkah and ten years after the Hijrah. His mission followed that of Isa, with no prophet between them.",
        verses: ["33:40", "96:1–5", "21:107", "9:40"], hadith: [3, 3442, 3535, 3902]
      }
    ]
  },
  {
    id: "isa-and-family",
    title: "Isa and the household of Zakariyya",
    note: "These accounts overlap. The Qur’an connects the household through Maryam and the announcements of two births.",
    prophets: [
      {
        id: "isa", name: "Isa (Jesus)", arabic: "عيسى",
        title: "The Messiah, son of Maryam",
        account: "Isa was born to Maryam without a human father. The Qur’an gives him the Injil and recounts his signs, including healing and raising the dead by Allah’s permission. He called the Children of Israel to worship Allah, confirmed the Torah, and announced a messenger to come after him named Ahmad. The Qur’an denies that his opponents killed or crucified him and says Allah raised him to Himself.",
        placement: "Al-Bukhari records that no prophet came between Isa and Muhammad ﷺ. The hadith about Isa’s future descent concerns the return of an earlier prophet.",
        verses: ["3:45–51", "5:44–46", "4:157–158", "61:6"], hadith: [3442, 3448]
      },
      {
        id: "yahya", name: "Yahya (John)", arabic: "يحيى",
        title: "Wisdom in childhood",
        account: "Allah answered Zakariyya’s prayer with news of Yahya. The Qur’an describes Yahya as a prophet and as confirming a word from Allah. It recounts that he was given judgment while still a child and portrays him as compassionate, pure, and dutiful to his parents.",
        placement: "The son of Zakariyya and a contemporary of Isa, whose story appears beside his in Surah Maryam.",
        verses: ["3:38–41", "19:7–15", "19:16–21"], hadith: [3207]
      },
      {
        id: "zakariyya", name: "Zakariyya (Zechariah)", arabic: "زكريا",
        title: "A prayer for an heir",
        account: "Zakariyya cared for Maryam and found provision with her in the sanctuary. He called upon Allah privately in old age, asking for an heir despite his wife’s barrenness. Allah granted him Yahya and appointed a period in which he would be unable to speak to people as a sign.",
        placement: "His guardianship of Maryam and fatherhood of Yahya tie him to this household. The entries do not imply three consecutive missions.",
        verses: ["3:35–41", "19:2–11", "21:89–90"]
      }
    ]
  },
  {
    id: "dawud-and-musa",
    title: "From Sulayman back to Musa",
    note: "The Qur’an establishes a father–son relationship and places Dawud’s encounter with Jalut after Musa. Harun and Musa shared a mission.",
    prophets: [
      {
        id: "sulayman", name: "Sulayman (Solomon)", arabic: "سليمان",
        title: "Kingship and gratitude",
        account: "Sulayman inherited from Dawud. The Qur’an recounts his understanding of the speech of birds, his gratitude after hearing the ant, and his correspondence with the Queen of Saba. Her story culminates in submitting to Allah. Sulayman’s prayer asks for the ability to give thanks and act righteously.",
        placement: "Dawud’s son and heir. They also appear together in an account of judgment over a field.",
        verses: ["27:15–44", "21:78–82"]
      },
      {
        id: "dawud", name: "Dawud (David)", arabic: "داود",
        title: "The Zabur and the duty of judgment",
        account: "Dawud defeated Jalut in the army of Talut, after which Allah gave him kingship and wisdom. Allah gave him the Zabur and commanded him to judge justly. The Qur’an also describes the mountains and birds joining in praise and iron being made pliable for him.",
        placement: "The narrative introducing Talut explicitly begins among the Children of Israel after Musa.",
        verses: ["2:246–251", "4:163", "38:17–26", "34:10–11"]
      },
      {
        id: "musa", name: "Musa (Moses)", arabic: "موسى",
        title: "Deliverance from Pharaoh",
        account: "The Qur’an follows Musa from infancy and his departure for Madyan to the divine call on his return. Allah sent him with signs to Pharaoh and commanded him to speak gently. Allah delivered Musa and those with him through the sea. The Qur’an describes the Torah as guidance and light and recounts Musa receiving the tablets.",
        placement: "Musa and Harun shared a mission. During the dispute over Musa, a believer from Pharaoh’s household recalled that Yusuf had already come with clear proofs. This anchors Yusuf before Musa.",
        verses: ["28:3–35", "20:9–48", "26:52–68", "5:44", "7:142–145", "40:34"]
      },
      {
        id: "harun", name: "Harun (Aaron)", arabic: "هارون",
        title: "A brother and fellow messenger",
        account: "Musa asked Allah to strengthen him through Harun, his brother, whom he described as more eloquent. Allah granted the request and sent them to Pharaoh. In Musa’s absence, Harun warned the people against worshipping the calf and called them to follow him.",
        placement: "Harun was a contemporary and partner in Musa’s mission.",
        verses: ["20:25–36", "20:42–48", "20:90–94", "28:34–35"]
      }
    ]
  },
  {
    id: "ibrahim-and-family",
    title: "The family of Ibrahim",
    note: "Scripture gives the family relationships. The missions of brothers and contemporaries can overlap.",
    prophets: [
      {
        id: "yusuf", name: "Yusuf (Joseph)", arabic: "يوسف",
        title: "From separation to reconciliation",
        account: "Surah Yusuf traces his childhood dream, his brothers’ betrayal, his trial in Egypt, and his imprisonment. His interpretation of the ruler’s dream comes with a plan for years of scarcity. Given responsibility over the storehouses, he eventually reunites with his family and forgives his brothers.",
        placement: "Son of Yaqub, grandson of Ishaq, and great-grandson of Ibrahim, as named in al-Bukhari.",
        verses: ["12:4–18", "12:36–57", "12:88–101"], hadith: [3382]
      },
      {
        id: "yaqub", name: "Yaqub (Jacob)", arabic: "يعقوب",
        title: "Patience without abandoning hope",
        account: "Yaqub recognized the significance of Yusuf’s dream and warned him about disclosing it. During their long separation he expressed his grief to Allah and told his sons to keep seeking Yusuf and his brother. The Qur’an also recalls his instruction to his children to worship the one God.",
        placement: "Son of Ishaq and father of Yusuf. His life overlaps Yusuf’s.",
        verses: ["11:71", "12:4–6", "12:83–98", "2:132–133"]
      },
      {
        id: "ishaq", name: "Ishaq (Isaac)", arabic: "إسحاق",
        title: "A promised son and prophet",
        account: "The visitors to Ibrahim’s household brought his wife glad tidings of Ishaq and, after Ishaq, Yaqub. The Qur’an names Ishaq as a righteous prophet and remembers him with Ibrahim and Yaqub among servants marked by strength and insight.",
        placement: "Son of Ibrahim and father of Yaqub. Listed beside his brother Ismail without assigning dates to their missions.",
        verses: ["11:69–73", "37:112–113", "38:45–47"]
      },
      {
        id: "ismail", name: "Ismail (Ishmael)", arabic: "إسماعيل",
        title: "Keeping promises and raising the House",
        account: "Ismail and Ibrahim raised the foundations of the House and prayed for Allah to accept their work. Surah Maryam calls Ismail a messenger and prophet who kept his promise and instructed his household in prayer and charity.",
        placement: "Ibrahim names Ismail and Ishaq as sons granted to him in old age. The Qur’an does not name the son in the passage about the sacrifice.",
        verses: ["2:125–129", "14:39", "19:54–55", "37:100–113"]
      },
      {
        id: "lut", name: "Lut (Lot)", arabic: "لوط",
        title: "A contemporary of Ibrahim",
        account: "Lut believed Ibrahim, and the Qur’an connects them through migration and deliverance. As a messenger, Lut challenged his people’s grave wrongdoing. The angels who visited Ibrahim also went to Lut, and Allah delivered Lut and his family except his wife, who remained with those overtaken by punishment.",
        placement: "The shared account of the angelic visitors directly links the two prophets’ lives.",
        verses: ["29:26", "21:71–75", "26:160–175", "11:69–83"]
      },
      {
        id: "ibrahim", name: "Ibrahim (Abraham)", arabic: "إبراهيم",
        title: "The friend of Allah",
        account: "Ibrahim challenged the worship of idols and called his father and people to worship Allah alone. When his people cast him into a fire, Allah made it cool and safe for him. The Qur’an calls him Allah’s friend and remembers him as an example of devotion. With Ismail he prayed that a messenger would be raised among their descendants.",
        placement: "The Qur’an explicitly places Nuh before Ibrahim and links Ibrahim to Lut, Ismail, Ishaq, and Yaqub.",
        verses: ["6:83–84", "19:41–48", "21:51–70", "4:125", "2:127–129"]
      }
    ]
  },
  {
    id: "early-peoples",
    title: "Early peoples and the beginning",
    note: "The Qur’an connects Salih’s people to Hud’s people, and Hud’s people to Nuh’s. Adam stands at the beginning of the human story.",
    prophets: [
      {
        id: "salih", name: "Salih", arabic: "صالح",
        title: "The she-camel of Thamud",
        account: "Salih called Thamud to worship Allah and presented the she-camel as a sign, warning them against harming her. His people had carved dwellings into mountains. They hamstrung the camel and defied the warning, while Allah saved Salih and those who believed.",
        placement: "Salih reminds Thamud that they were made successors after Ad. The verse orders the peoples without dating either prophet.",
        verses: ["7:73–79", "11:61–68"]
      },
      {
        id: "hud", name: "Hud", arabic: "هود",
        title: "A warning to Ad",
        account: "Hud told Ad to worship Allah alone and seek forgiveness. He reminded them of the strength they had been given and asked no payment for his call. When they persisted in rejecting him, Allah saved Hud and those with him. The Qur’an describes a destructive wind sent against Ad.",
        placement: "Hud reminds Ad that they succeeded the people of Nuh.",
        verses: ["7:65–72", "11:50–60", "69:6–8"]
      },
      {
        id: "nuh", name: "Nuh (Noah)", arabic: "نوح",
        title: "The first messenger sent to the people of the earth",
        account: "Nuh describes calling his people by night and day, publicly and privately. The Qur’an says he remained among them for a thousand years less fifty before the flood overtook them. He built the Ark by Allah’s direction. The account of his son, who sought refuge on a mountain, shows that family ties did not guarantee deliverance.",
        placement: "Al-Bukhari’s intercession report distinguishes Adam, the father of humanity, from Nuh, the first messenger sent to the inhabitants of the earth. The Qur’an places Nuh before Ibrahim.",
        verses: ["71:5–20", "29:14–15", "11:36–48", "6:84"], hadith: [4476]
      },
      {
        id: "adam", name: "Adam", arabic: "آدم",
        title: "Creation, repentance, and guidance",
        account: "Allah created Adam, taught him the names, and commanded the angels to prostrate, which Iblis refused. Adam and his spouse were tested in the Garden. After their lapse, Adam received words from his Lord and Allah accepted his repentance. The account ends with a promise of guidance for human life on earth.",
        placement: "Adam begins the human story. A report in Sahih Ibn Hibban explicitly identifies him as a prophet. The Qur’an gives no calendar date for his creation or interval between him and Nuh.",
        verses: ["2:30–39", "7:11–27", "20:115–123"], hadith: [4476]
      }
    ]
  }
];

export const lessPreciselyPlaced: Prophet[] = [
  {
    id: "ilyas", name: "Ilyas (Elijah)", arabic: "إلياس",
    title: "A call away from Baal",
    account: "The Qur’an calls Ilyas a messenger. He challenged his people for calling upon Baal while neglecting Allah, their Lord and the Lord of their forefathers. The passage closes by honoring him among Allah’s believing servants.",
    placement: "The Qur’anic account gives neither a date nor a synchronism with another named prophet.",
    verses: ["37:123–132", "6:85"]
  },
  {
    id: "al-yasa", name: "Al-Yasaʿ (Elisha)", arabic: "اليسع",
    title: "Remembered among the chosen",
    account: "The Qur’an names Al-Yasaʿ among those Allah favored and lists him alongside Ismail and Dhul-Kifl among the excellent. It preserves his name and standing without narrating a mission in detail.",
    placement: "His appearance in a list of prophets does not establish a succession or an interval.",
    verses: ["6:86–89", "38:48"]
  },
  {
    id: "yunus", name: "Yunus (Jonah)", arabic: "يونس",
    title: "A supplication in the darkness",
    account: "Yunus boarded a laden ship, lost the drawing of lots, and was swallowed by a great fish. In the darkness he affirmed Allah’s oneness and admitted his wrongdoing. Allah delivered him, and the Qur’an singles out his people as a community whose faith benefited them when punishment threatened.",
    placement: "His mission is clear. The passages do not fix its position relative to the other prophets in this section.",
    verses: ["37:139–148", "21:87–88", "10:98"]
  },
  {
    id: "shuayb", name: "Shuayb", arabic: "شعيب",
    title: "Worship and honesty in trade",
    account: "Shuayb called the people of Madyan to worship Allah and give full measure and weight. He warned against depriving people of what was due to them and spreading corruption. He says he seeks reform as far as he is able and relies on Allah for success.",
    placement: "Shuayb invokes the fate of Lut’s people as a warning and says they are not far from his audience. This connects the accounts without fixing an interval or identifying Shuayb as the man Musa later meets in Madyan.",
    verses: ["11:84–95", "7:85–93", "28:22–28"]
  },
  {
    id: "ayyub", name: "Ayyub (Job)", arabic: "أيوب",
    title: "Patience in affliction",
    account: "Ayyub turned to Allah in distress, appealing to His mercy. Allah removed his affliction and restored his family, with others like them. The Qur’an remembers him as patient and repeatedly turning to his Lord.",
    placement: "The Qur’an names Ayyub among recipients of revelation but gives neither a date nor a length for his ordeal.",
    verses: ["21:83–84", "38:41–44", "4:163"]
  },
  {
    id: "dhul-kifl", name: "Dhul-Kifl", arabic: "ذو الكفل",
    title: "Patience and righteousness",
    account: "The Qur’an names Dhul-Kifl among the patient and the righteous. Ibn Kathir reads his inclusion alongside prophets as evidence in favor of prophethood and records disagreement. The Qur’an does not explicitly call him a prophet.",
    placement: "His date and identity beyond the Qur’anic name are undetermined here. He is included as a figure traditionally counted in the familiar list of 25.",
    verses: ["21:85–86", "38:48"]
  },
  {
    id: "idris", name: "Idris", arabic: "إدريس",
    title: "A truthful prophet raised high",
    account: "Surah Maryam calls Idris a truthful man and a prophet whom Allah raised to a high station. Surah al-Anbiya includes him among the patient. Al-Bukhari’s report of the Night Journey records Muhammad ﷺ meeting Idris in the fourth heaven.",
    placement: "The cited verses and hadith do not settle whether Idris lived before Nuh. The order of encounters on the Night Journey is not used as a chronology.",
    verses: ["19:56–58", "21:85–86"], hadith: [3207]
  }
];
