// Saints library. Filipino patrons featured first, then doctors, mystics, martyrs, apostles.
// Full age-tier stories for the two Filipino founding patrons; brief plus adult story for the rest.
//
// Format: { slug, name, feast_day (MM-DD), category, era, nationality, patron_of,
//           brief, full_story_child, full_story_teen, full_story_adult, key_quote,
//           theology_tags (JSON array), age_appropriate }

const saints = [];

// === FILIPINO FOUNDING PATRONS ===

saints.push({
  slug: 'lorenzo-ruiz',
  name: 'St. Lorenzo Ruiz',
  feast_day: '09-28',
  category: 'martyr',
  era: '17th century',
  nationality: 'Filipino',
  patron_of: 'the Philippines, Filipino youth, families fleeing persecution',
  brief: 'The first Filipino saint. A husband and father from Binondo, Manila, who was martyred in Nagasaki for refusing to deny Christ.',
  full_story_child: 'Lorenzo Ruiz was a Filipino dad with a wife and three children in old Manila. He helped the church as an altar server when he was a boy, and he grew up working with words and numbers. One day he got into trouble that was not his fault. To stay safe he sailed away on a ship and ended up in a faraway country called Japan, where Christians were being hunted. The soldiers caught him and asked him: "Will you say you do not love Jesus, and we will let you go home?" Lorenzo said: "I am a Christian, and I will die a Christian. Even if I had a thousand lives I would give them all for Jesus." So they killed him, and he went straight to heaven. Many years later the Pope said: he is a saint. He is the first Filipino saint, and he is praying for our family right now.',
  full_story_teen: 'Lorenzo Ruiz was born around 1600 in Binondo, Manila, the Chinese-Filipino quarter of the city. His father was Chinese, his mother Filipina. He grew up in the Dominican parish, learned to read and write in Spanish and Tagalog, married a Filipina named Rosario, and had three children. He worked as a calligrapher and clerk of a Catholic confraternity. In 1636 he was falsely accused of killing a Spaniard. Fleeing arrest, he boarded a ship with three Dominican priests and a Japanese priest, not knowing they were sailing into Japan, where the Tokugawa shoguns were torturing every Christian they could find. He was captured almost immediately. For weeks the Japanese magistrates tortured him with water and the gallows, trying to force him to apostatize. They offered him his life if he would step on an image of Christ. He refused. His last recorded words were: "I am a Catholic and wholeheartedly do accept death for God. Had I a thousand lives, all of these I would offer to him." He was hung upside down in a pit on September 27, 1637 and died the next day. He had not chosen the path of martyrdom. The path chose him. He said yes. That is sainthood.',
  full_story_adult: 'San Lorenzo Ruiz was born around 1600 in the Binondo district of Manila to a Chinese father and a Tagalog mother. He was raised in the Dominican parish, served as a sacristan, learned calligraphy, and became the clerk of the Cofradia del Santisimo Rosario. He married a woman named Rosario and was the father of three children, two sons and a daughter. By every measure he was an ordinary Catholic layman: a husband, a father, a working man with steady employment and a place in his parish. In 1636 he was implicated, almost certainly falsely, in the death of a Spaniard. Fearing arrest under colonial Spanish justice, he asked the Dominicans for help. They put him aboard a ship that, unknown to him, was bound for Japan with a missionary party of three Dominican priests and a Japanese priest, Father Vicente Shiwozuka de la Cruz. The Tokugawa shogunate at that time was in the middle of the most savage persecution of Christians the modern world had yet seen. Within weeks of landing at Okinawa the entire party was arrested and taken to Nagasaki. There Lorenzo and his companions were subjected to the water torture and the gallows. They were finally offered the standard release: trample on a fumi-e, an image of Christ or the Virgin, and walk free. Lorenzo replied: "Ego Catholicus sum et animo prompto paratoque pro Deo mortem obibo. Si mille vitas haberem, cunctas ei offerrem." I am a Catholic and wholeheartedly do accept death for God. If I had a thousand lives I would offer them all to him. On September 27, 1637, he and his companions were strapped upside down in the tsurushi pit at Nishizaka Hill, the same hill where the twenty-six martyrs of Nagasaki had died forty years before. He died the next day, September 28, of slow suffocation and hemorrhage. He was beatified by Pope John Paul II in Manila in 1981, the first beatification ever held outside Rome, and canonized in 1987. He is the first Filipino saint. He was not a priest. He was not a religious. He was a husband and a father with a job and a family. He did not seek the cross. The cross came looking for him, and he did not run. Every Filipino family that prays the rosary together has him as their first canonized intercessor in heaven.',
  key_quote: 'I am a Catholic and wholeheartedly do accept death for God. Had I a thousand lives, all of these I would offer to him.',
  theology_tags: '["martyrdom","fidelity","family","filipino","layperson","fatherhood"]',
  age_appropriate: 'all'
});

saints.push({
  slug: 'pedro-calungsod',
  name: 'Blessed Pedro Calungsod',
  feast_day: '04-02',
  category: 'martyr',
  era: '17th century',
  nationality: 'Filipino',
  patron_of: 'Filipino youth, catechists, missionaries, the Visayas',
  brief: 'A teenage Visayan catechist who was martyred in Guam alongside Blessed Diego Luis de San Vitores while bringing the faith to the Chamorro people.',
  full_story_child: 'Pedro was a Filipino boy from the Visayas. When he was a teenager he sailed away on a missionary ship to a faraway island called Guam to help a priest named Father Diego teach the people about Jesus. One day a man who hated the missionaries came after them with a spear. Pedro was strong and quick. He could have run away. He did not. He stood next to Father Diego to protect him, and they killed him there. He was just a teenager. He is now a Blessed in heaven, and Pope says one day soon he will be called a saint.',
  full_story_teen: 'Pedro Calungsod was born around 1654, somewhere in the Visayas, possibly in Cebu or Iloilo or Leyte. We do not know his exact birthplace. We know he was a teenage catechist, fluent enough in his faith and his languages to be chosen as a missionary companion to the Jesuit Father Diego Luis de San Vitores when San Vitores set sail for the Mariana Islands in 1668. For four years Pedro walked the islands with Father Diego, baptizing infants, teaching the catechism in the Chamorro language, building chapels. A Chinese resident named Choco spread the rumor that the baptismal water was poisoned and that the missionaries were killing babies. On April 2, 1672, in the village of Tomhom on Guam, a chieftain named Mata pa and a warrior named Hirao caught up with them. Pedro was perhaps seventeen years old. He was carrying the bag with the baptismal supplies. Hirao threw a spear. Pedro could have dodged. Witnesses said he stood his ground next to Father Diego. The spear went through him. Mata pa finished him with a cutlass. Father Diego was killed moments after. They were thrown into the sea. Pedro was beatified in 2000 and canonized in 2012 as the second Filipino saint. He was a teenager. He died on mission. He did not run.',
  full_story_adult: 'Blessed Pedro Calungsod (canonized in 2012 by Pope Benedict XVI, raising him to St. Pedro Calungsod in the universal calendar though Heavenward retains the title "Blessed" in honor of his original cause) was a Visayan lay catechist born around 1654. The exact birthplace remains contested between Cebu, Iloilo, Molo, Leyte, and Loboc; the records that survive identify him only as a young man from the Visayas. He was recruited by the Spanish Jesuit Father Diego Luis de San Vitores to accompany the first sustained Catholic mission to the Mariana Islands. The mission departed Manila in 1668. For four years Pedro served as catechist, translator, sacristan, and lay companion. He taught the Chamorro people their first prayers, helped administer baptism to children, and assisted in the construction of the first churches on Guam. The mission encountered opposition from a Chinese trader named Choco, who circulated the rumor that the baptismal water was lethal. When infants who had been baptized later died of disease, the rumor gained credence and a faction of the Chamorro turned violent against the missionaries. On April 2, 1672, in the village of Tomhom (modern Tumon), the chieftain Mata pa and the warrior Hirao confronted Father Diego and the seventeen-or-so-year-old Pedro. Hirao threw a spear that struck Pedro. Witnesses testified that Pedro, an athletic young man, could have dodged it but chose to remain at the priest’s side. Mata pa then killed him with a cutlass. Father Diego was killed moments later. Their bodies were tied to stones and cast into the sea. Pedro Calungsod was beatified by Pope John Paul II on March 5, 2000, and canonized by Pope Benedict XVI on October 21, 2012, becoming the second Filipino saint after San Lorenzo Ruiz. He is the patron of Filipino youth, catechists, and the missionary impulse of the Visayan Church. He was a teenager. He was a layperson. He died protecting a priest and a mission. He chose not to dodge.',
  key_quote: 'He could have run. He did not.',
  theology_tags: '["martyrdom","missionary","youth","catechist","filipino","layperson","loyalty"]',
  age_appropriate: 'all'
});

// === MARIAN ===

saints.push({
  slug: 'mary',
  name: 'Blessed Virgin Mary',
  feast_day: '01-01',
  category: 'marian',
  era: '1st century',
  nationality: 'Israelite',
  patron_of: 'the universal Church, all mothers, all families',
  brief: 'The Mother of God. The first Christian. The one who said yes.',
  full_story_child: 'Mary was a young Jewish girl in a small village called Nazareth. An angel came to her and asked her if she would be the mother of Jesus. She said yes. That single yes opened heaven for all of us. She is the mother of Jesus, and because of that, she is the mother of every Christian, including you.',
  full_story_teen: 'Mary was a young Jewish woman, probably about fourteen or fifteen, when the angel Gabriel appeared to her in Nazareth and proposed something terrifying: she would conceive a child by the Holy Spirit, and that child would be the Son of God. In her culture, an unmarried pregnant girl could be stoned. She said yes anyway. Her fiat ("let it be done to me according to your word") is the single most important yes in human history. She raised Jesus. She watched him die. She was given to John, and through John to all of us, as our mother.',
  full_story_adult: 'Mary of Nazareth, the Theotokos, the Mother of God. From the Annunciation to the Assumption, the entire mystery of the Incarnation passes through her free consent. She was preserved from original sin from the moment of her conception by a singular grace of God in view of the merits of her Son (the Immaculate Conception, dogma 1854). She conceived by the Holy Spirit, remained a virgin in the conception and birth and after, raised the Lord, stood at the foot of the cross, received the Spirit at Pentecost with the apostles, and at the end of her earthly life was assumed body and soul into the glory of heaven (the Assumption, dogma 1950). She is the perfect disciple. Her last recorded words in Scripture, at Cana, are spoken to every Christian: Do whatever he tells you. (John 2:5)',
  key_quote: 'Behold, I am the handmaid of the Lord; let it be to me according to your word.',
  theology_tags: '["marian","fiat","theotokos","obedience","motherhood","intercession"]',
  age_appropriate: 'all'
});

saints.push({
  slug: 'joseph',
  name: 'St. Joseph',
  feast_day: '03-19',
  category: 'patriarch',
  era: '1st century',
  nationality: 'Israelite',
  patron_of: 'fathers, workers, the universal Church, a happy death',
  brief: 'The husband of Mary. The foster father of Jesus. The silent guardian.',
  full_story_child: 'Joseph was a carpenter in a small village. He was the husband of Mary and the earthly father of Jesus. He worked with wood and taught Jesus how to work with wood. He never says a single word in the Bible. He just does what God asks him. He is the patron saint of every father.',
  full_story_teen: 'Joseph was a tekton, a craftsman in wood and stone, from the village of Nazareth. He was betrothed to Mary when he discovered she was pregnant. The law allowed him to denounce her publicly. He chose instead to dismiss her quietly. Before he could, an angel appeared in a dream and told him the child was of the Holy Spirit. Joseph obeyed. He took Mary as his wife, named the child Jesus, fled with them to Egypt to save the child from Herod, brought them home to Nazareth, raised the boy, taught him a trade. Joseph does not speak a single word in the Gospels. He just acts. He is what a father looks like when he listens to God.',
  full_story_adult: 'Saint Joseph, husband of Mary, foster father of Jesus Christ, patron of the universal Church (Pius IX, 1870), patron of workers (Pius XII), patron of a happy death. Of him the Scriptures record no spoken word, only obedient action: he takes Mary as his wife when the angel speaks (Matthew 1:24), he flees into Egypt when the angel speaks (Matthew 2:14), he returns to Nazareth when the angel speaks (Matthew 2:21). He is descended from David through both natural and legal succession, which is how Christ inherits the throne of David. He raised the Son of God. He taught him his trade. He died, according to ancient tradition, in the arms of Jesus and Mary, which is why he is the patron of a happy death. He is the model of the Catholic father: quiet, faithful, listening, working, protecting, present. A recent Year of St. Joseph was proclaimed for the universal Church; Pope Leo XIV continues to recommend his patronage to all Catholic families.',
  key_quote: 'Go to Joseph. (Genesis 41:55)',
  theology_tags: '["fatherhood","work","silence","obedience","family","protection"]',
  age_appropriate: 'all'
});

// === DOCTORS / MYSTICS / TEACHERS ===

const compact = [
  { slug: 'therese-of-lisieux', name: 'St. Thérèse of Lisieux', feast: '10-01', cat: 'doctor', era: '19th century', nat: 'French',
    patron: 'missions, florists, those suffering quietly', tags: '["little_way","childhood","trust","suffering","missions"]',
    brief: 'A French Carmelite nun who died at twenty-four and taught the world the Little Way: doing small things with great love.',
    quote: 'Picking up a pin for love can save a soul.',
    adult: 'Marie Françoise-Thérèse Martin entered the Carmel of Lisieux at fifteen, died of tuberculosis at twenty-four, and was hidden inside her cloister for her entire religious life. After her death her autobiography Story of a Soul was circulated and the Church discovered a doctor. Her "Little Way" is the spirituality of trust: doing the smallest things with the greatest love, abandoning oneself wholly into the arms of God like a child into a Father. Declared Doctor of the Church by John Paul II in 1997, one of only four women doctors.' },

  { slug: 'john-paul-ii', name: 'St. John Paul II', feast: '10-22', cat: 'pope', era: '20th-21st century', nat: 'Polish',
    patron: 'World Youth Day, families, the unborn', tags: '["theology_of_the_body","family","youth","courage","mercy"]',
    brief: 'The Polish Pope who taught the Theology of the Body, helped bring down communism, and called the youth of the world to be saints.',
    quote: 'Be not afraid! Open wide the doors to Christ!',
    adult: 'Karol Józef Wojtyła, born 1920 in Wadowice, Poland. Lost his mother at nine, his only sibling at twelve, his father at twenty-one. Survived the Nazi occupation as a seminarian in a clandestine seminary in Krakow. Ordained 1946. Bishop 1958. Cardinal 1967. Elected Pope 1978, the first non-Italian pope in 455 years. He reigned 27 years, the second-longest pontificate in history. He gave the Church the Theology of the Body, the New Evangelization, World Youth Day, the Catechism of the Catholic Church, and the Luminous Mysteries of the Rosary. He survived an assassination attempt and forgave his attacker. He played a central role in the peaceful collapse of European communism. Canonized 2014.' },

  { slug: 'thomas-aquinas', name: 'St. Thomas Aquinas', feast: '01-28', cat: 'doctor', era: '13th century', nat: 'Italian',
    patron: 'students, schools, theologians, philosophers', tags: '["reason","theology","truth","study","faith_and_reason"]',
    brief: 'The Dominican friar who showed that faith and reason are not enemies. The Angelic Doctor.',
    quote: 'To one who has faith, no explanation is necessary. To one without faith, no explanation is possible.',
    adult: 'Thomas of Aquino, 1225-1274. Son of an Italian noble family who tried to kidnap him to prevent him entering the Dominicans. He joined anyway. Studied under Albert the Great in Cologne. Wrote the Summa Theologiae, perhaps the single greatest synthesis of Christian thought ever produced. After a mystical experience near the end of his life he laid down his pen and said all he had written seemed like straw compared to what he had been shown. Doctor of the Church. Patron of every Catholic university.' },

  { slug: 'augustine', name: 'St. Augustine of Hippo', feast: '08-28', cat: 'doctor', era: '4th-5th century', nat: 'North African',
    patron: 'theologians, converts, printers', tags: '["conversion","grace","sin","truth","intellect"]',
    brief: 'The brilliant North African bishop who spent his youth chasing pleasure and his maturity teaching the Church about grace.',
    quote: 'You have made us for yourself, O Lord, and our hearts are restless until they rest in you.',
    adult: 'Aurelius Augustinus, 354-430. Born in Thagaste in North Africa to a pagan father and the Christian Saint Monica. A brilliant rhetorician who lived for years with a concubine and fathered a son. Through Monica’s prayers and the preaching of St. Ambrose he converted in 386 and was baptized at the Easter Vigil 387. Became Bishop of Hippo. Wrote the Confessions, the City of God, On Christian Doctrine, On the Trinity. The single most influential theologian in the Western Church after St. Paul. Doctor of the Church.' },

  { slug: 'francis-of-assisi', name: 'St. Francis of Assisi', feast: '10-04', cat: 'religious', era: '12th-13th century', nat: 'Italian',
    patron: 'animals, ecology, the poor, Italy', tags: '["poverty","creation","joy","peace","franciscan"]',
    brief: 'The merchant’s son who stripped himself naked in the public square, married Lady Poverty, and called all creatures brother and sister.',
    quote: 'Preach the Gospel always. When necessary, use words.',
    adult: 'Giovanni di Pietro di Bernardone, 1181-1226. Son of a wealthy cloth merchant. After a year as a prisoner of war and a long illness he heard Christ speak from the crucifix at San Damiano: "Rebuild my Church, which you see is falling into ruin." He stripped himself naked before the bishop and gave his clothes back to his father. He founded the Friars Minor (Franciscans) and, with Saint Clare, the Poor Clares. He received the stigmata on Mount La Verna in 1224, the first known stigmatic. He composed the Canticle of the Creatures. He died singing.' },

  { slug: 'ignatius-of-loyola', name: 'St. Ignatius of Loyola', feast: '07-31', cat: 'religious', era: '16th century', nat: 'Spanish',
    patron: 'soldiers, retreats, the Jesuits', tags: '["discernment","spiritual_exercises","obedience","mission","jesuit"]',
    brief: 'A Basque soldier whose leg was shattered by a cannonball. While healing he read the lives of the saints, converted, and founded the Society of Jesus.',
    quote: 'Go forth and set the world on fire.',
    adult: 'Iñigo López de Loyola, 1491-1556. Spanish soldier from a noble Basque family. At the siege of Pamplona in 1521 a cannonball shattered his leg. During his convalescence he asked for romance novels; the only books in the castle were a Life of Christ and a Lives of the Saints. He read them. He converted. He went to Manresa and wrote the Spiritual Exercises. He studied with poor students at Paris and there gathered the first companions who would become the Society of Jesus. Founded the Jesuits in 1540. He sent St. Francis Xavier to India and Japan.' },

  { slug: 'catherine-of-siena', name: 'St. Catherine of Siena', feast: '04-29', cat: 'doctor', era: '14th century', nat: 'Italian',
    patron: 'Italy, nurses, against fire, Europe', tags: '["mystic","reform","church","prayer","courage","woman_doctor"]',
    brief: 'A Dominican tertiary who could neither read nor write at first but who lectured popes and called the Pope home to Rome.',
    quote: 'Be who God meant you to be and you will set the world on fire.',
    adult: 'Caterina Benincasa, 1347-1380. The 23rd of 25 children in a Sienese dyer’s family. At seven she took a private vow of virginity. At sixteen she became a Dominican tertiary. She received the stigmata, dictated The Dialogue, ministered to plague victims, and personally persuaded Pope Gregory XI to return the papacy from Avignon to Rome in 1377. Doctor of the Church (proclaimed 1970, with Teresa of Avila, the first women so honored). Patroness of Europe.' },

  { slug: 'teresa-benedicta', name: 'St. Teresa Benedicta of the Cross (Edith Stein)', feast: '08-09', cat: 'martyr', era: '20th century', nat: 'German-Jewish',
    patron: 'Europe, World Youth Day, against the loss of parents, martyrs', tags: '["jewish_convert","philosophy","martyrdom","carmelite","auschwitz","truth"]',
    brief: 'A German Jewish philosopher who became a Carmelite nun and was murdered at Auschwitz.',
    quote: 'Come, we are going for our people.',
    adult: 'Edith Stein, 1891-1942. Born into an Orthodox Jewish family in Breslau. A brilliant phenomenologist, student of Edmund Husserl. Lost her faith as a teenager, found Christ in 1921 while reading the autobiography of St. Teresa of Avila in a single night. Baptized 1922. Entered Carmel in Cologne 1933, took the name Teresa Benedicta of the Cross. When the Nazis came for her she did not flee. She and her sister Rosa were arrested August 2, 1942 and killed at Auschwitz a week later. Co-Patroness of Europe.' },

  { slug: 'gianna-molla', name: 'St. Gianna Beretta Molla', feast: '04-28', cat: 'married', era: '20th century', nat: 'Italian',
    patron: 'mothers, the unborn, doctors', tags: '["motherhood","pro_life","sacrifice","vocation","marriage"]',
    brief: 'A pediatrician, wife, and mother who chose to die so that her unborn daughter might live.',
    quote: 'If you must choose between me and the baby, no hesitation. Choose, I demand it, the baby. Save her.',
    adult: 'Gianna Beretta Molla, 1922-1962. Italian pediatrician, married to Pietro Molla in 1955. When pregnant with her fourth child in 1961 a fibroma was discovered on her uterus. The doctors offered her three options: hysterectomy (which would end the pregnancy), removal of the fibroma alone (which carried risk to her life), or abortion. She chose to remove only the fibroma. The pregnancy continued. On Holy Saturday 1962 she gave birth to her daughter Gianna Emanuela. She died of septic peritonitis a week later. She had told her husband and the doctors clearly: if there must be a choice, save the child. She was canonized in 2004. Her daughter Gianna Emanuela was present at the canonization.' },

  { slug: 'joan-of-arc', name: 'St. Joan of Arc', feast: '05-30', cat: 'martyr', era: '15th century', nat: 'French',
    patron: 'France, soldiers, women in leadership, those persecuted unjustly', tags: '["courage","obedience","martyrdom","vocation","france","virginity"]',
    brief: 'A nineteen-year-old peasant girl who led the armies of France at the command of saints she heard in her heart, and was burned alive for it.',
    quote: 'I am not afraid. I was born to do this.',
    adult: 'Jeanne d’Arc, 1412-1431. Daughter of peasant farmers in Domremy. From age thirteen she heard the voices of St. Michael, St. Catherine of Alexandria, and St. Margaret telling her to drive the English out of France and crown the Dauphin at Reims. At seventeen she rode armored into Orleans and broke the siege. At eighteen she crowned Charles VII at Reims Cathedral. At nineteen she was captured by the Burgundians, sold to the English, tried by a corrupt ecclesiastical court at Rouen, and burned alive on May 30, 1431. Her last word was the name Jesus. Posthumously declared innocent. Canonized 1920.' },

  { slug: 'teresa-of-avila', name: 'St. Teresa of Avila', feast: '10-15', cat: 'doctor', era: '16th century', nat: 'Spanish',
    patron: 'Spain, headaches, those in religious orders, contemplatives', tags: '["mystic","reform","carmelite","prayer","woman_doctor"]',
    brief: 'A Spanish Carmelite nun who reformed her order, wrote The Interior Castle, and was the first woman declared Doctor of the Church.',
    quote: 'Let nothing disturb you. God alone suffices.',
    adult: 'Teresa de Cepeda y Ahumada, 1515-1582. Entered the Carmel of the Incarnation at Avila at twenty. After two decades of mediocrity she experienced a profound conversion before an image of the wounded Christ. She founded the Discalced Carmelites with St. John of the Cross, reforming the order back to its primitive observance, founding seventeen monasteries on horseback across Spain. She wrote the Autobiography, The Way of Perfection, The Interior Castle. Declared Doctor of the Church 1970, the first woman so named.' },

  { slug: 'john-of-the-cross', name: 'St. John of the Cross', feast: '12-14', cat: 'doctor', era: '16th century', nat: 'Spanish',
    patron: 'mystics, poets, contemplatives', tags: '["mystic","dark_night","carmelite","poetry","reform"]',
    brief: 'The Spanish Carmelite poet and mystic who wrote the Dark Night of the Soul.',
    quote: 'In the evening of life, we shall be judged on love alone.',
    adult: 'Juan de Yepes y Alvarez, 1542-1591. Co-founder, with St. Teresa of Avila, of the Discalced Carmelite reform. Imprisoned by his own brethren in a closet in Toledo for nine months for trying to reform the order. In that closet he composed the Spiritual Canticle. He went on to write the Ascent of Mount Carmel, the Dark Night of the Soul, and the Living Flame of Love. Doctor of the Church.' },

  { slug: 'padre-pio', name: 'St. Padre Pio of Pietrelcina', feast: '09-23', cat: 'religious', era: '20th century', nat: 'Italian',
    patron: 'confessors, civil defense volunteers, January blues', tags: '["stigmata","confession","suffering","capuchin","intercession"]',
    brief: 'The Capuchin friar who bore the stigmata for fifty years and heard confessions ten hours a day.',
    quote: 'Pray, hope, and don’t worry.',
    adult: 'Francesco Forgione, 1887-1968. Capuchin priest from Pietrelcina, southern Italy. Received the visible stigmata in 1918 and bore the wounds of Christ in his hands, feet, and side for the next fifty years. Suffered investigation and silencing by the Holy Office; remained obedient. Founded the Casa Sollievo della Sofferenza hospital. Heard confessions ten to twelve hours a day for decades. Was reported to have read souls. Canonized 2002 by St. John Paul II.' },

  { slug: 'maximilian-kolbe', name: 'St. Maximilian Mary Kolbe', feast: '08-14', cat: 'martyr', era: '20th century', nat: 'Polish',
    patron: 'drug addicts, prisoners, families, journalists, the pro-life movement', tags: '["martyrdom","auschwitz","marian","franciscan","sacrifice","fatherhood"]',
    brief: 'The Polish Franciscan who volunteered to die in place of a stranger at Auschwitz.',
    quote: 'I am a Catholic priest.',
    adult: 'Rajmund Kolbe, 1894-1941. Polish Conventual Franciscan. Founded the Militia of the Immaculata, the Niepokalanow friary (which grew to 800 friars), and missions in Japan including a friary at Nagasaki that survived the atomic bomb. Arrested by the Gestapo in 1941 for harboring Jews and Polish refugees. Sent to Auschwitz, prisoner 16670. When a prisoner escaped, the camp commandant selected ten men to die by starvation in retaliation. One of them, Franciszek Gajowniczek, cried out: "My wife, my children!" Kolbe stepped forward and said: "I am a Catholic priest. Let me take his place." The commandant agreed. Kolbe led the ten in prayer in the starvation bunker for two weeks. He was the last alive. The Nazis finally killed him with an injection of carbolic acid on August 14, 1941. Gajowniczek survived the war and lived another fifty-three years. Canonized 1982.' },

  { slug: 'pier-giorgio-frassati', name: 'Blessed Pier Giorgio Frassati', feast: '07-04', cat: 'lay_youth', era: '20th century', nat: 'Italian',
    patron: 'World Youth Day, students, mountaineers, young adults', tags: '["youth","mountaineering","poverty","social_justice","lay_apostolate"]',
    brief: 'A young Italian mountain climber and lay apostle who served the poor of Turin and died at twenty-four.',
    quote: 'Verso l’alto. To the heights.',
    adult: 'Pier Giorgio Frassati, 1901-1925. Son of the founder of La Stampa newspaper in Turin. A passionate mountaineer, a member of Catholic Action, a Dominican tertiary. He gave away his money, his clothes, even his shoes to the poor of Turin while his family thought he was just a college student climbing mountains on the weekends. He contracted polio, probably from one of the poor he served, and died in four days at twenty-four. At his funeral the streets of Turin were lined with thousands of poor people his own family had never known he served. Beatified by John Paul II 1990.' },

  { slug: 'thomas-more', name: 'St. Thomas More', feast: '06-22', cat: 'martyr', era: '16th century', nat: 'English',
    patron: 'lawyers, statesmen, politicians, large families', tags: '["martyrdom","conscience","family","statesman","england","layperson"]',
    brief: 'Lord Chancellor of England who lost his head rather than approve the king’s divorce.',
    quote: 'I die the King’s good servant, but God’s first.',
    adult: 'Thomas More, 1478-1535. Lawyer, statesman, author of Utopia, Lord Chancellor of England under Henry VIII. A devoted husband and father of four. When Henry VIII demanded that More acknowledge him as Supreme Head of the Church in England and approve his divorce from Catherine of Aragon, More refused, resigned the chancellorship, and went into silent retirement. Henry was not satisfied. More was tried for treason on perjured testimony, imprisoned in the Tower of London, and beheaded on Tower Hill July 6, 1535. Canonized 1935.' },

  { slug: 'jerome', name: 'St. Jerome', feast: '09-30', cat: 'doctor', era: '4th-5th century', nat: 'Dalmatian',
    patron: 'scholars, translators, librarians', tags: '["scripture","translation","scholarship","penance","desert"]',
    brief: 'The crusty Dalmatian scholar who translated the Bible into Latin (the Vulgate) and lived as a hermit in Bethlehem.',
    quote: 'Ignorance of Scripture is ignorance of Christ.',
    adult: 'Eusebius Hieronymus Sophronius, c. 347-420. Educated in Rome, baptized there, and went to live as a hermit in the Syrian desert. Mastered Hebrew. Commissioned by Pope Damasus to revise the Old Latin translation of the Bible; the result, the Vulgate, was the standard Bible of the Western Church for over a thousand years. Settled in Bethlehem in a cave near the Nativity. Famously irascible. Doctor of the Church.' },

  { slug: 'francis-de-sales', name: 'St. Francis de Sales', feast: '01-24', cat: 'doctor', era: '16th-17th century', nat: 'Savoyard',
    patron: 'writers, journalists, the deaf, confessors', tags: '["gentleness","spiritual_direction","writing","conversion","lay_holiness"]',
    brief: 'The gentle bishop of Geneva who taught that holiness is for everyone, not just monks and nuns.',
    quote: 'Nothing is so strong as gentleness, nothing so gentle as real strength.',
    adult: 'François de Sales, 1567-1622. Bishop of Geneva (in exile, since the city was Calvinist). Reconverted some 70,000 Calvinists by preaching and by pamphlets slipped under doors. With St. Jane Frances de Chantal he founded the Visitation Sisters. His Introduction to the Devout Life, addressed to a married laywoman, was the first widely circulated book to insist that all baptized Christians, in every state of life, are called to genuine holiness. Doctor of the Church.' },

  { slug: 'benedict-of-nursia', name: 'St. Benedict of Nursia', feast: '07-11', cat: 'religious', era: '5th-6th century', nat: 'Italian',
    patron: 'Europe, monks, students, against poison', tags: '["monasticism","stability","prayer_and_work","rule","europe"]',
    brief: 'The father of Western monasticism. Author of the Rule that shaped Europe.',
    quote: 'Ora et labora. Pray and work.',
    adult: 'Benedict of Nursia, c. 480-547. Withdrew from a corrupted Rome to live as a hermit at Subiaco. Eventually founded twelve small monasteries and then the great monastery at Monte Cassino. There he wrote the Rule of St. Benedict, a balanced and merciful guide to community life under an abbot, organized around prayer, study, manual work, and stability. The Rule became the framework for Western monasticism and, through the monasteries, for the rebuilding of Europe after the fall of Rome. Patron of Europe.' },

  { slug: 'dominic', name: 'St. Dominic', feast: '08-08', cat: 'religious', era: '12th-13th century', nat: 'Spanish',
    patron: 'astronomers, the falsely accused, scientists', tags: '["preaching","rosary","poverty","study","dominican"]',
    brief: 'The Spanish priest who founded the Order of Preachers (the Dominicans) and helped spread devotion to the Rosary.',
    quote: 'Have charity among yourselves, guard humility, and make your treasure out of poverty.',
    adult: 'Domingo de Guzmán, 1170-1221. Canon of Osma. Sent into southern France to preach against the Albigensian heresy. Realized that the wandering Cathar preachers were succeeding because they imitated apostolic poverty while official Catholic preachers traveled with retinues. Founded the Order of Preachers in 1216, vowed to poverty and study, to combine the contemplative life with active preaching. Tradition associates him strongly with the Rosary.' },

  { slug: 'peter', name: 'St. Peter the Apostle', feast: '06-29', cat: 'apostle', era: '1st century', nationality: 'Israelite', nat: 'Israelite',
    patron: 'fishermen, popes, the universal Church', tags: '["apostle","pope","papacy","denial","forgiveness","martyrdom"]',
    brief: 'The fisherman whom Christ named Rock, who denied him three times, who was forgiven, and who was crucified upside down in Rome.',
    quote: 'Lord, to whom shall we go? You have the words of eternal life.',
    adult: 'Simon bar Jonah of Bethsaida, renamed Cephas / Petros / Peter by Christ. The first of the Twelve. Confessed Christ as Son of the Living God (Matthew 16). Was given the keys. Denied Christ three times in the courtyard of the high priest. Was forgiven three times by the lakeside (John 21). Preached the first Christian sermon at Pentecost. First Bishop of Antioch, then of Rome. Crucified upside down in the Vatican circus under Nero around AD 64. His tomb is directly under the high altar of St. Peter’s Basilica. The first pope. Pope Leo XIV is his 267th successor.' },

  { slug: 'paul', name: 'St. Paul the Apostle', feast: '06-29', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'missionaries, theologians, journalists, writers', tags: '["apostle","conversion","missions","epistles","persecution","martyrdom"]',
    brief: 'The brilliant Pharisee who tried to wipe out the Church, was knocked off his horse by the risen Christ, and became the apostle of the Gentiles.',
    quote: 'I have fought the good fight, I have finished the race, I have kept the faith.',
    adult: 'Saul of Tarsus, c. 5-67. A Roman citizen, a Pharisee, a student of Gamaliel, a violent persecutor of the early Church. Knocked from his horse on the road to Damascus by the voice of the risen Christ. Baptized. Spent years in the Arabian desert in prayer. Became the great missionary of the Gentile world: three missionary journeys, fourteen letters in the New Testament canon, founder of churches across Asia Minor, Greece, and Italy. Beheaded outside Rome under Nero. The Apostle to the Gentiles.' },

  { slug: 'john-the-apostle', name: 'St. John the Apostle', feast: '12-27', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'theologians, writers, the dying', tags: '["apostle","beloved_disciple","gospel","revelation","mary"]',
    brief: 'The beloved disciple. The one who stood at the foot of the cross. The one to whom Christ gave his mother.',
    quote: 'God is love.',
    adult: 'John of Zebedee. The youngest of the Twelve. The disciple whom Jesus loved (John 13:23). The only apostle who stood at the foot of the cross. There Christ gave his mother into John’s keeping and John into hers. Author of the Fourth Gospel, three Letters, and the Revelation. Exiled by Domitian to Patmos. The only apostle not to be martyred; he died of old age at Ephesus.' },

  { slug: 'mary-magdalene', name: 'St. Mary Magdalene', feast: '07-22', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'penitents, contemplatives, perfumers, the converted', tags: '["resurrection","apostle_to_the_apostles","conversion","love"]',
    brief: 'The first witness of the Resurrection. The Apostle to the Apostles.',
    quote: 'I have seen the Lord!',
    adult: 'Mary of Magdala. Christ cast seven demons out of her (Luke 8:2). She followed him through Galilee. She stood at the cross. She came to the tomb at first light on Easter morning. She was the first human being to whom the risen Christ appeared, and the first to proclaim the Resurrection to the Apostles. The Eastern Church and the Western since 2016 honor her as Apostola Apostolorum, Apostle to the Apostles, with a feast at the same rank as the other apostles.' },

  { slug: 'stephen', name: 'St. Stephen', feast: '12-26', cat: 'martyr', era: '1st century', nat: 'Israelite',
    patron: 'deacons, stonemasons, against headaches', tags: '["protomartyr","deacon","forgiveness","witness"]',
    brief: 'The first Christian martyr. A deacon who was stoned to death praying for those who killed him.',
    quote: 'Lord, do not hold this sin against them.',
    adult: 'Stephen, one of the seven deacons chosen by the Twelve. Filled with grace and power. Brought before the Sanhedrin on false charges, he preached the longest sermon recorded in the Acts of the Apostles (chapter 7), tracing the history of Israel’s rejection of God’s messengers. He was dragged outside Jerusalem and stoned. Before he died he saw the heavens opened and Christ standing at the right hand of God. His last words were a prayer for his killers. Saul of Tarsus held the coats. The protomartyr. His feast is December 26 because Christmas is incomplete without remembering the cost of discipleship.' },

  { slug: 'elizabeth-of-hungary', name: 'St. Elizabeth of Hungary', feast: '11-17', cat: 'married', era: '13th century', nat: 'Hungarian',
    patron: 'hospitals, nurses, bakers, the homeless, widows', tags: '["charity","royalty","franciscan","widowhood","poor"]',
    brief: 'A Hungarian princess and Thuringian duchess who fed the poor from the castle kitchens and built hospitals with her dowry.',
    quote: 'See how I have cheated my lord with these roses!',
    adult: 'Elizabeth of Hungary, 1207-1231. Daughter of Andrew II of Hungary, married at fourteen to Ludwig IV of Thuringia. They had three children in six years of marriage; their union was tender and faithful. She fed the poor at the castle gates, built hospitals, became a Franciscan tertiary. Ludwig died on crusade. Her in-laws drove her from the castle. She lived the rest of her short life in radical poverty serving the poor at the hospital she built at Marburg. Died at twenty-four.' },

  { slug: 'rose-of-lima', name: 'St. Rose of Lima', feast: '08-23', cat: 'religious', era: '16th-17th century', nat: 'Peruvian',
    patron: 'the Americas, Latin America, Peru, embroiderers, florists', tags: '["mystic","penance","americas","dominican","virginity"]',
    brief: 'The first saint born in the Americas. A Peruvian Dominican tertiary who lived a hidden life of penance and prayer.',
    quote: 'Apart from the cross, there is no other ladder by which we may get to heaven.',
    adult: 'Isabel Flores de Oliva, 1586-1617. Born in Lima, Peru, of Spanish and Indigenous descent. Took St. Catherine of Siena as her model and lived as a Dominican tertiary in a small hut in her parents’ garden. Severe penances, profound mystical experiences, tireless service to the poor and the sick of Lima. Died at thirty-one. The first canonized saint of the Americas.' },

  { slug: 'martin-de-porres', name: 'St. Martin de Porres', feast: '11-03', cat: 'religious', era: '16th-17th century', nat: 'Peruvian',
    patron: 'mixed-race people, public health, social justice, hairdressers, the poor', tags: '["charity","humility","dominican","americas","race","animals"]',
    brief: 'A Peruvian Dominican lay brother of mixed race, known for radical humility and miraculous charity.',
    quote: 'Everything, even sweeping, scraping vegetables, weeding a garden, and waiting on the sick could be a prayer, if it were offered to God.',
    adult: 'Martin de Porres, 1579-1639. Born in Lima of a Spanish father and a freed African mother. As a mixed-race child he was legally barred from full religious profession; he served the Dominicans as a donado, a humble servant. The community eventually accepted him as a lay brother. He ran the infirmary, founded an orphanage, fed hundreds of poor every day, was said to be seen in two places at once, to have raised the dead, and to have made friends with rats. Patron of those who serve the poor.' },

  // Additional saints to bring count above 50
  { slug: 'cecilia', name: 'St. Cecilia', feast: '11-22', cat: 'martyr', era: '3rd century', nat: 'Roman',
    patron: 'musicians, singers, composers', tags: '["martyrdom","music","virginity","early_church"]',
    brief: 'A young Roman noblewoman martyred for her Christian faith. Patroness of music.',
    quote: 'I have my song; the Lord is my song.',
    adult: 'A noblewoman of Rome who consecrated her virginity to Christ. She converted her husband Valerian and his brother Tiburtius, both of whom were martyred before her. She herself was condemned, survived an attempt to suffocate her, was struck three times with a sword but lived three more days, evangelizing those who came to see her. Patron of musicians because, the legend says, she "sang in her heart to God" on her wedding day.' },

  { slug: 'monica', name: 'St. Monica', feast: '08-27', cat: 'married', era: '4th century', nat: 'North African',
    patron: 'mothers, married women, alcoholics, victims of adultery', tags: '["motherhood","perseverance","prayer","conversion"]',
    brief: 'The North African mother whose tears and prayers, over seventeen years, won the conversion of her son St. Augustine.',
    quote: 'Nothing is far from God.',
    adult: 'Monica, 331-387. A devout Christian married to a pagan Roman official named Patricius, whom she eventually converted. Bore three children, the eldest of whom was Augustine. For seventeen years she wept and prayed for his conversion as he chased after every fashionable heresy and lived with a concubine. She followed him from Africa to Rome to Milan, where her prayers and the preaching of St. Ambrose finally brought him home. She died shortly after his baptism, telling him: do not concern yourself about where to bury me. Wherever you are, remember me at the altar of the Lord.' },

  { slug: 'anthony-of-padua', name: 'St. Anthony of Padua', feast: '06-13', cat: 'doctor', era: '12th-13th century', nat: 'Portuguese',
    patron: 'lost things, lost people, the poor, travelers', tags: '["franciscan","preaching","poverty","intercession"]',
    brief: 'The Portuguese Franciscan friar whose preaching could empty cities and whose intercession finds what is lost.',
    quote: 'The spirit of humility is sweeter than honey.',
    adult: 'Fernando Martins de Bulhões, 1195-1231. Augustinian canon turned Franciscan after seeing the relics of the first Franciscan martyrs. A preacher of legendary power; his sermons could draw tens of thousands and convert hardened heretics. Doctor of the Church (1946). The Italians call him il santo, the saint. The popular tradition of asking him for help finding lost objects goes back to a story of a novice who stole his psalter and returned it after the saint’s prayer.' },

  { slug: 'rita', name: 'St. Rita of Cascia', feast: '05-22', cat: 'married', era: '14th-15th century', nat: 'Italian',
    patron: 'impossible causes, abused wives, widows', tags: '["impossible_causes","forgiveness","marriage","augustinian","widowhood"]',
    brief: 'The patron saint of impossible causes. A widow whose forgiveness ended a generations-long feud and who entered religious life in old age.',
    quote: 'Through prayer all things are possible.',
    adult: 'Rita of Cascia, 1381-1457. Married against her will at twelve to a cruel man, Paolo Mancini. She bore him two sons. Through her patience he converted in the last year of his life and asked her forgiveness. He was then murdered in a vendetta. Her sons swore revenge. She prayed they would die before staining their souls with murder; both died within the year. Widowed and childless, she sought to enter the Augustinian convent at Cascia. They refused her three times because she was a widow. She persisted. Eventually she received a wound on her forehead from the crown of thorns of a crucifix in the convent that remained for the last fifteen years of her life. The patron of impossible causes.' },

  { slug: 'philomena', name: 'St. Philomena', feast: '08-11', cat: 'martyr', era: '4th century', nat: 'Greek',
    patron: 'infants, youth, mothers, the impossible', tags: '["martyrdom","virginity","intercession","cure_d_ars"]',
    brief: 'A young virgin martyr of the early Church, beloved patroness of St. John Vianney and St. Therese.',
    quote: 'Pure of heart and strong in love.',
    adult: 'Discovered in 1802 in the catacombs of Priscilla in Rome with the inscription PAX TECUM FILUMENA. Devotion exploded across nineteenth-century Europe through the favors granted to those who invoked her. St. John Vianney, St. John Bosco, St. Madeleine Sophie Barat, and St. Therese of Lisieux all had a personal devotion to her.' },

  { slug: 'andrew', name: 'St. Andrew the Apostle', feast: '11-30', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'Scotland, Russia, Ukraine, Greece, fishermen', tags: '["apostle","brother_of_peter","martyrdom","x_cross"]',
    brief: 'Brother of Peter. The first-called apostle. Crucified on an X-shaped cross.',
    quote: 'Behold the Lamb of God!',
    adult: 'Andrew of Bethsaida. A disciple of John the Baptist before following Christ. The first apostle called, who then brought his brother Simon to Jesus. After Pentecost he preached in Greece and the Black Sea region. Crucified at Patras on a saltire cross, the X-shaped cross that bears his name. Patron of Scotland, Russia, Ukraine, and Greece.' },

  { slug: 'james-the-greater', name: 'St. James the Greater', feast: '07-25', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'Spain, pilgrims, laborers, those with rheumatism', tags: '["apostle","martyrdom","santiago","camino","brother_of_john"]',
    brief: 'Apostle, brother of John, the first apostle to be martyred. His shrine at Compostela in Spain has drawn pilgrims for over a thousand years.',
    quote: 'We are able.',
    adult: 'James son of Zebedee, brother of John. Witnessed the Transfiguration, the raising of Jairus’s daughter, and the agony in the Garden. Beheaded by Herod Agrippa around AD 44, the first of the Twelve to be martyred. Tradition holds that his body was translated to Compostela in northwest Spain, whose cathedral is the destination of the Camino de Santiago.' },

  { slug: 'matthew', name: 'St. Matthew the Apostle', feast: '09-21', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'accountants, bankers, tax collectors, customs officers', tags: '["apostle","gospel","conversion","levi"]',
    brief: 'The tax collector who left his table when Christ said: "Follow me." Author of the first Gospel.',
    quote: 'He rose and followed him.',
    adult: 'Levi son of Alphaeus, called Matthew. A tax collector for Rome in Capernaum, despised as a collaborator. Christ saw him at his post and said: Follow me. He rose and followed (Matthew 9:9). Author of the first Gospel, written in Aramaic, then translated into the Greek we have. Tradition places his later mission in Ethiopia, where he was martyred.' },

  { slug: 'mark', name: 'St. Mark the Evangelist', feast: '04-25', cat: 'evangelist', era: '1st century', nat: 'Israelite',
    patron: 'Venice, Egypt, lions, notaries, prisoners', tags: '["evangelist","gospel","peter","venice","alexandria"]',
    brief: 'The young companion of Peter and Paul who wrote the shortest and earliest Gospel.',
    quote: 'The beginning of the good news of Jesus Christ, the Son of God.',
    adult: 'John Mark of Jerusalem. The young man who fled naked from Gethsemane (Mark 14:51-52). Companion of Paul on the first missionary journey, then of Peter at Rome, where he wrote down Peter’s preaching as the Gospel of Mark, the shortest and earliest of the four. Founded the Church of Alexandria. Martyred there. His relics are in the Basilica of San Marco in Venice.' },

  { slug: 'luke', name: 'St. Luke the Evangelist', feast: '10-18', cat: 'evangelist', era: '1st century', nat: 'Greek',
    patron: 'physicians, artists, surgeons', tags: '["evangelist","gospel","acts","physician","paul"]',
    brief: 'The beloved physician who wrote the Gospel of Luke and the Acts of the Apostles.',
    quote: 'And Mary kept all these things, pondering them in her heart.',
    adult: 'Luke the physician, native of Antioch, companion of Paul. The only Gentile author in the New Testament. Wrote a single two-volume work, the Gospel and the Acts, the most detailed account we have of the early Church. Tradition says he interviewed Mary personally for the infancy narratives. Also called the first iconographer; tradition has him painting the first icons of the Virgin.' },

  { slug: 'gabriel-archangel', name: 'St. Gabriel the Archangel', feast: '09-29', cat: 'angel', era: 'eternal', nat: 'angel',
    patron: 'messengers, broadcasters, postal workers', tags: '["archangel","annunciation","messenger"]',
    brief: 'The archangel who announced the Incarnation to Mary.',
    quote: 'Hail, full of grace, the Lord is with you.',
    adult: 'One of the three archangels named in Scripture. Sent to Daniel to interpret his visions. Sent to Zechariah to announce the birth of John the Baptist. Sent to Mary at the Annunciation. The angel of revelation.' },

  { slug: 'michael-archangel', name: 'St. Michael the Archangel', feast: '09-29', cat: 'angel', era: 'eternal', nat: 'angel',
    patron: 'soldiers, police officers, the dying, the Church, Germany', tags: '["archangel","warrior","spiritual_warfare","exorcism"]',
    brief: 'The captain of the heavenly host. The one who cast Satan out of heaven.',
    quote: 'Who is like God?',
    adult: 'The archangel whose name is itself a battle cry: Mi-cha-El, "Who is like God?" He casts the dragon out of heaven (Revelation 12). He is the protector of Israel (Daniel 12), the protector of the Church, the patron of all who fight evil. The Prayer to St. Michael, composed by Pope Leo XIII after a vision in 1884, is the great Catholic prayer of spiritual warfare.' },

  { slug: 'raphael-archangel', name: 'St. Raphael the Archangel', feast: '09-29', cat: 'angel', era: 'eternal', nat: 'angel',
    patron: 'travelers, the blind, doctors, lovers, happy meetings', tags: '["archangel","healing","tobit","travelers"]',
    brief: 'The archangel of healing, who guided Tobias on his journey.',
    quote: 'I am Raphael, one of the seven angels who stand before the Lord.',
    adult: 'The archangel of the Book of Tobit. He travels with Tobias, helps him win Sarah as his wife, heals the elder Tobit of blindness. His name means "God heals." Patron of travelers and of healing.' },

  { slug: 'nicholas', name: 'St. Nicholas of Myra', feast: '12-06', cat: 'bishop', era: '4th century', nat: 'Anatolian',
    patron: 'children, sailors, the falsely accused, Russia, those without dowries', tags: '["charity","children","gift_giving","intercession"]',
    brief: 'The bishop who threw bags of gold through windows to save three girls from a life of slavery. The historical Santa Claus.',
    quote: 'Give, that you may receive.',
    adult: 'Nicholas of Myra, c. 270-343. Bishop of Myra in Lycia. Imprisoned during the Diocletian persecution. Took part in the Council of Nicaea in 325. Famous for his generosity, especially the story of the three daughters whose father could not afford their dowries; Nicholas threw bags of gold through their window by night, three nights in a row, saving them from being sold into slavery. The historical seed of Santa Claus. Patron of children and of sailors.' },

  { slug: 'patrick', name: 'St. Patrick', feast: '03-17', cat: 'bishop', era: '5th century', nat: 'Romano-British',
    patron: 'Ireland, missionaries, against snakes', tags: '["missionary","ireland","trinity","slave","bishop"]',
    brief: 'The Romano-British slave who was kidnapped to Ireland, escaped, and then went back as a bishop to convert the island.',
    quote: 'Christ before me, Christ behind me, Christ in me.',
    adult: 'Patricius, c. 385-461. Son of a Roman British deacon. Kidnapped by Irish pirates at sixteen and enslaved as a shepherd in Ireland for six years. Escaped. Returned home, became a priest, then a bishop. Sent as a missionary back to the very people who had enslaved him. Walked Ireland for thirty years preaching the Trinity, often using the shamrock. Wrote the Confessio and the famous Lorica (the Breastplate of St. Patrick).' },

  { slug: 'george', name: 'St. George', feast: '04-23', cat: 'martyr', era: '3rd-4th century', nat: 'Cappadocian',
    patron: 'England, soldiers, scouts, against the plague', tags: '["martyrdom","soldier","dragon","courage"]',
    brief: 'The Roman soldier turned martyr, slayer of dragons in legend, patron of soldiers everywhere.',
    quote: 'I am a Christian.',
    adult: 'George of Cappadocia, d. 303. A Roman soldier of high rank. Refused to participate in the Diocletian persecution of Christians. Tortured and beheaded at Nicomedia. The legend of the dragon, popularized in the medieval Golden Legend, is allegory: the dragon is paganism, the maiden is the Church. Patron of England, of Catalonia, of Georgia, of soldiers.' },

  { slug: 'cecilia-day-prayer', name: 'St. Anne', feast: '07-26', cat: 'patriarch', era: '1st century BC', nat: 'Israelite',
    patron: 'grandmothers, mothers, women in labor, miners', tags: '["motherhood","grandmother","family","mary"]',
    brief: 'The mother of the Blessed Virgin. The grandmother of Jesus.',
    quote: 'Behold my daughter.',
    adult: 'Anne, the mother of the Blessed Virgin Mary. Tradition names her, with her husband Joachim, as the parents of Our Lady. The grandmother of Jesus. Patroness of mothers and grandmothers and of those carrying children.' },

  { slug: 'joachim', name: 'St. Joachim', feast: '07-26', cat: 'patriarch', era: '1st century BC', nat: 'Israelite',
    patron: 'grandfathers, fathers, married couples', tags: '["fatherhood","grandfather","family","mary"]',
    brief: 'The father of the Blessed Virgin. The grandfather of Jesus.',
    quote: 'Behold my daughter.',
    adult: 'Joachim, the father of the Blessed Virgin Mary, husband of Saint Anne. By tradition a man of Galilee. Patron of grandfathers and of married couples.' },

  { slug: 'maximilian-of-tebessa', name: 'St. Maximilian of Tebessa', feast: '03-12', cat: 'martyr', era: '3rd century', nat: 'North African',
    patron: 'conscientious objectors', tags: '["martyrdom","conscience","military","early_church"]',
    brief: 'A young North African Christian who refused to serve in the Roman army and was beheaded at twenty-one.',
    quote: 'I cannot serve. I am a Christian.',
    adult: 'A young Christian in third-century North Africa. Brought before the proconsul to be conscripted into the legions. Refused, citing his Christian conscience. Beheaded at twenty-one. The earliest documented Christian conscientious objector.' },

  { slug: 'jeanne-jugan', name: 'St. Jeanne Jugan', feast: '08-30', cat: 'religious', era: '19th century', nat: 'French',
    patron: 'the elderly poor, caregivers', tags: '["charity","elderly","poverty","hidden_life","little_sisters"]',
    brief: 'The Breton servant who founded the Little Sisters of the Poor by carrying a blind, paralyzed old woman home to her own bed.',
    quote: 'It is so beautiful to be poor.',
    adult: 'Jeanne Jugan, 1792-1879. A poor Breton servant. One winter night in 1839 she met an elderly blind paralyzed widow with nowhere to go. Jeanne carried her home, put her in her own bed, and slept on the floor. From that one act grew the Little Sisters of the Poor, now in over thirty countries, caring for the elderly poor. She was elected superior, then quietly removed by her own community, and lived the last twenty-seven years of her life in obscurity within her own foundation. Canonized 2009.' },

  { slug: 'kateri', name: 'St. Kateri Tekakwitha', feast: '07-14', cat: 'lay_youth', era: '17th century', nat: 'Mohawk',
    patron: 'ecology, the environment, Native Americans, exiles', tags: '["indigenous","virginity","conversion","americas","youth"]',
    brief: 'The Mohawk-Algonquin convert known as the Lily of the Mohawks, the first canonized Native American saint.',
    quote: 'Jesus, I love you.',
    adult: 'Kateri Tekakwitha, 1656-1680. Born in what is now upstate New York to a Mohawk father and an Algonquin Christian mother. Lost her family to smallpox at four; the disease left her face scarred and her eyesight weak. Baptized at twenty by a Jesuit missionary. Fled to the Christian Mohawk mission at Kahnawake near Montreal to escape persecution and a forced marriage. Lived a life of intense prayer and penance. Died at twenty-four. Her last words: Jesus, I love you. Her face was reported to have lost its scars in death. The first canonized Native American saint (2012).' },

  { slug: 'damien-of-molokai', name: 'St. Damien of Molokai', feast: '05-10', cat: 'religious', era: '19th century', nat: 'Belgian',
    patron: 'leprosy patients, outcasts, those with HIV', tags: '["missionary","leprosy","sacrifice","priest","hawaii"]',
    brief: 'The Belgian priest who volunteered to serve the leper colony on Molokai and died of the disease he caught from those he served.',
    quote: 'We lepers.',
    adult: 'Jozef De Veuster, 1840-1889. Belgian priest of the Sacred Hearts of Jesus and Mary. Volunteered in 1873 for the leper colony on the island of Molokai in Hawaii, which the kingdom had turned into a quarantine without resident clergy. He served them sixteen years, built them coffins, dressed their wounds, gave them dignity. He contracted leprosy himself in 1884 and began his sermons thereafter with "we lepers." Died at forty-nine. Canonized 2009.' },

  { slug: 'faustina', name: 'St. Faustina Kowalska', feast: '10-05', cat: 'religious', era: '20th century', nat: 'Polish',
    patron: 'mercy, those needing trust, addicts', tags: '["divine_mercy","mysticism","poland","kowalska","apostle_of_mercy"]',
    brief: 'The Polish nun whose visions of the merciful Christ gave the world the Divine Mercy devotion.',
    quote: 'Jesus, I trust in you.',
    adult: 'Helena Kowalska, 1905-1938. Polish Sister of Our Lady of Mercy. From 1931 received apparitions and locutions of Christ as the Merciful One, the source of the Divine Mercy devotion: the image, the chaplet, the feast on the Sunday after Easter, the Hour of Mercy at 3 PM. Her diary, Divine Mercy in My Soul, runs to over six hundred pages of mystical theology. Died of tuberculosis at thirty-three. Canonized by St. John Paul II in 2000.' },

  { slug: 'mother-teresa', name: 'St. Teresa of Calcutta', feast: '09-05', cat: 'religious', era: '20th century', nat: 'Albanian',
    patron: 'World Youth Day, missionaries of charity, the dying, those in spiritual darkness', tags: '["charity","poor","missionaries_of_charity","calcutta","dark_night"]',
    brief: 'The little Albanian sister who saw Christ in every dying person in the slums of Calcutta.',
    quote: 'Do small things with great love.',
    adult: 'Anjezë Gonxhe Bojaxhiu, 1910-1997. Albanian, joined the Sisters of Loreto at eighteen, sent to India, taught at a school in Calcutta. In 1946, on a train ride, received what she called "the call within the call": to leave the convent and live among the poorest of the poor, finding Christ in their distressing disguise. Founded the Missionaries of Charity in 1950. They now run homes for the dying in over 130 countries. For nearly fifty years she lived in a dark night of the soul, feeling no consolation in prayer, while ministering daily to thousands. Canonized 2016.' },

  { slug: 'john-bosco', name: 'St. John Bosco', feast: '01-31', cat: 'religious', era: '19th century', nat: 'Italian',
    patron: 'young people, students, editors, magicians', tags: '["youth","education","salesian","preventive_system","joy"]',
    brief: 'The Italian priest who founded the Salesians and built oratories for thousands of poor boys in industrial Turin.',
    quote: 'It is enough that you are young for me to love you.',
    adult: 'Giovanni Melchiorre Bosco, 1815-1888. Italian diocesan priest. Founded the Salesians of Don Bosco, with his Preventive System of education: reason, religion, kindness. Built oratories for poor boys in Turin during the industrial revolution. Could juggle, do magic tricks, and walk a tightrope; used them to gather boys for catechism. The Salesians are now one of the largest religious congregations in the Church.' },

  // === Filling common gaps so most days have a saint ===

  { slug: 'simon-stock', name: 'St. Simon Stock', feast: '05-16', cat: 'religious', era: '13th century', nat: 'English',
    patron: 'tanners, the Carmelite order, those who wear the brown scapular', tags: '["carmelite","marian","scapular","prayer"]',
    brief: 'The English Carmelite to whom Our Lady gave the brown scapular.',
    quote: 'Flower of Carmel, vine blossom-laden.',
    adult: 'Simon Stock, c. 1165-1265, the early prior general of the Carmelite Order in Europe. Tradition holds that on the night of July 16, 1251, the Blessed Virgin appeared to him at Cambridge holding the brown scapular and promising her protection to all who would wear it faithfully. From this devotion comes the centuries-old practice of the brown scapular and the Sabbatine privilege. Patron of the Carmelite Order and a Marian saint of quiet, hidden faithfulness.' },

  { slug: 'john-nepomucene', name: 'St. John Nepomucene', feast: '05-16', cat: 'martyr', era: '14th century', nat: 'Bohemian',
    patron: 'the seal of the confessional, bridges, against floods, Bohemia, Czechia', tags: '["martyrdom","confession","priesthood","silence"]',
    brief: 'The Czech priest martyred for refusing to break the seal of the confessional - thrown from the Charles Bridge in Prague.',
    quote: 'I will not break the seal.',
    adult: 'Jan Nepomucky, c. 1345-1393. Priest of the diocese of Prague and confessor to the queen of Bohemia. King Wenceslaus IV demanded John reveal what the queen had told him in confession. He refused. The king had him tortured and then bound and thrown from the Charles Bridge into the Vltava river. The patron of all who keep the seal of the confessional, and of bridges, the most depicted saint in Central Europe after Mary.' },

  { slug: 'matthias-apostle', name: 'St. Matthias the Apostle', feast: '05-14', cat: 'apostle', era: '1st century', nat: 'Israelite',
    patron: 'alcoholics, carpenters, tailors, against smallpox', tags: '["apostle","election","replacement_of_judas"]',
    brief: 'The apostle chosen by lot to replace Judas after the Resurrection.',
    quote: 'Show, O Lord, which one of these you have chosen.',
    adult: 'Matthias, chosen by lot from among the seventy-two disciples to take the place of Judas Iscariot (Acts 1:15-26). Tradition places his later mission in Cappadocia and the regions around the Caspian Sea, where he is said to have been martyred. The thirteenth apostle.' },

  { slug: 'isidore-farmer', name: 'St. Isidore the Farmer', feast: '05-15', cat: 'lay_youth', era: '11th-12th century', nat: 'Spanish',
    patron: 'farmers, rural communities, Madrid, day laborers', tags: '["farmer","work","poverty","layperson","family"]',
    brief: 'A Spanish farmer whose plow was driven by angels while he prayed at Mass.',
    quote: 'Lord, what wonderful work you give me to do.',
    adult: 'Isidro de Merlo y Quintana, c. 1070-1130. A Spanish farm laborer outside Madrid, married to St. Maria Torribia (Maria de la Cabeza). Famous for his daily attendance at Mass before work and for the legend that angels drove his plow while he prayed. He and his wife lost their only son in childhood. Patron of farmers, of Madrid, and of working laypeople.' },

  { slug: 'rita-2', name: 'St. Pope John I', feast: '05-18', cat: 'pope', era: '6th century', nat: 'Italian',
    patron: 'martyrs, those imprisoned for the faith', tags: '["papacy","martyrdom","arian"]',
    brief: 'A pope sent on a diplomatic mission to Constantinople by an Arian king, then imprisoned and starved to death on his return.',
    quote: 'I have kept the faith.',
    adult: 'John I (470-526), the 53rd Bishop of Rome. Sent by the Arian Ostrogoth king Theodoric to Constantinople to negotiate with the Catholic emperor Justin I. The mission succeeded on most points but the king was displeased and on John\'s return imprisoned him at Ravenna, where he died of starvation and ill-treatment.' },

  { slug: 'paschal-baylon', name: 'St. Paschal Baylon', feast: '05-17', cat: 'religious', era: '16th century', nat: 'Spanish',
    patron: 'Eucharistic congresses, shepherds, cooks', tags: '["eucharist","franciscan","poverty","contemplation"]',
    brief: 'The Franciscan shepherd-saint of Eucharistic adoration.',
    quote: 'I seek God in the tabernacle.',
    adult: 'Paschal Baylon, 1540-1592. Spanish Franciscan lay brother, born to peasants, a shepherd as a child, taught himself to read so he could pray the Office of the Blessed Sacrament. Famous throughout Spain for his ecstatic devotion to the Holy Eucharist. Declared by Leo XIII the patron of all Eucharistic Congresses and confraternities of the Blessed Sacrament.' },

  { slug: 'bernardine-siena', name: 'St. Bernardine of Siena', feast: '05-20', cat: 'religious', era: '14th-15th century', nat: 'Italian',
    patron: 'advertisers, communicators, against hoarseness, gambling addicts', tags: '["franciscan","preaching","holy_name","reform"]',
    brief: 'The great Franciscan preacher of the Holy Name of Jesus.',
    quote: 'Jesus, name above every name.',
    adult: 'Bernardine of Siena, 1380-1444. Italian Franciscan preacher. Reformed the Observant branch of the Franciscan order, preached missions across northern and central Italy that drew tens of thousands, and popularized the IHS monogram of the Holy Name of Jesus, which he held up on a tablet for the crowds to venerate. A doctor of the holy name.' },

  { slug: 'philip-neri', name: 'St. Philip Neri', feast: '05-26', cat: 'religious', era: '16th century', nat: 'Italian',
    patron: 'Rome, joy, comedians, the Oratory', tags: '["joy","humor","oratory","reform","rome"]',
    brief: 'The cheerful saint of Rome, the apostle of joy, founder of the Oratory.',
    quote: 'A joyful heart is more easily made perfect than a downcast one.',
    adult: 'Filippo Romolo Neri, 1515-1595. Florentine layman who walked the streets of Rome at night during the chaos of the post-Reformation Church, sleeping in catacombs to pray with the martyrs. Founded the Oratory, a community of priests dedicated to preaching, music (with Palestrina), and the spiritual care of pilgrims and the poor. A saint famous for laughter, practical jokes used to humble pride, and a tenderness with sinners that drew Rome back to confession.' },

  { slug: 'paul-vi', name: 'St. Pope Paul VI', feast: '05-29', cat: 'pope', era: '20th century', nat: 'Italian',
    patron: 'evangelization, the Second Vatican Council', tags: '["papacy","vatican_ii","evangelii_nuntiandi","humanae_vitae"]',
    brief: 'The pope who saw Vatican II to its close and defended the dignity of marriage in Humanae Vitae.',
    quote: 'To evangelize is the deepest identity of the Church.',
    adult: 'Giovanni Battista Montini, 1897-1978. Pope from 1963. Saw the Second Vatican Council to its close and oversaw its implementation. Issued Humanae Vitae (1968) reaffirming Catholic teaching on married love, the unitive and procreative meanings of conjugal love, and the moral evil of contraception. Wrote Evangelii Nuntiandi (1975) which Pope Leo XIV still calls the magna carta of evangelization. Canonized 2018.' },

  { slug: 'pentecost-mary', name: 'Mary, Mother of the Church', feast: '06-01', cat: 'marian', era: '1st century', nat: 'Israelite',
    patron: 'the universal Church, pastors, Christian unity', tags: '["marian","ecclesiology","pentecost","motherhood"]',
    brief: 'Mary contemplated as the Mother of the Church, given by Christ from the cross.',
    quote: 'Behold thy mother.',
    adult: 'A liturgical memorial established for the whole Latin Church in 2018, observed on the Monday after Pentecost. It crystallizes a title used since the patristic era and emphasized at Vatican II: Mary as Mother of the Church, given to all the faithful by Christ from the cross when he said to the beloved disciple, "Behold thy mother." (John 19:27)' },

  { slug: 'norbert', name: 'St. Norbert', feast: '06-06', cat: 'religious', era: '11th-12th century', nat: 'German',
    patron: 'safe childbirth, peace, the Premonstratensians', tags: '["reform","priesthood","preaching","peace"]',
    brief: 'A German nobleman turned wandering preacher who founded the Premonstratensian (Norbertine) canons.',
    quote: 'Preach by your life.',
    adult: 'Norbert of Xanten, c. 1080-1134. Lived a worldly life as a canon at the court of Cologne until a near-death experience converted him. Ordained, he gave away his wealth, walked Europe barefoot as a preacher of peace, and founded the Premonstratensian Order at Premontre in France. Later became Archbishop of Magdeburg.' },

  { slug: 'aloysius-gonzaga', name: 'St. Aloysius Gonzaga', feast: '06-21', cat: 'religious', era: '16th century', nat: 'Italian',
    patron: 'youth, students, plague victims, AIDS caregivers', tags: '["youth","jesuit","chastity","plague","sacrifice"]',
    brief: 'The Italian nobleman-turned-Jesuit who died at twenty-three nursing plague victims in Rome.',
    quote: 'It is better to be a child of God than the king of all the earth.',
    adult: 'Luigi Gonzaga, 1568-1591. Eldest son of an Italian marquis. Renounced his inheritance to enter the Society of Jesus. While still a young Jesuit student in Rome, the plague struck the city; he volunteered to carry the dying to hospitals. He caught the plague from a sick man he was carrying on his back and died at twenty-three. Patron of Catholic youth.' },

  { slug: 'cyril-methodius', name: 'Sts. Cyril and Methodius', feast: '02-14', cat: 'religious', era: '9th century', nat: 'Greek',
    patron: 'Europe, Slavic peoples, ecumenism', tags: '["missionaries","slavic","alphabet","europe"]',
    brief: 'The Greek brothers who brought the Gospel to the Slavs and gave them an alphabet.',
    quote: 'The Word of God should be heard in every language.',
    adult: 'Cyril (Constantine, 826-869) and Methodius (815-885), Byzantine brothers from Thessalonica. Sent on mission to the Slavic peoples of Great Moravia, they translated the Scriptures and the Liturgy into Old Church Slavonic, inventing the Glagolitic alphabet (the ancestor of Cyrillic). Co-Patrons of Europe with St. Benedict, St. Bridget of Sweden, St. Catherine of Siena, and St. Teresa Benedicta of the Cross.' },

  { slug: 'sacred-heart', name: 'Sacred Heart of Jesus', feast: '06-19', cat: 'devotion', era: 'eternal', nat: 'divine',
    patron: 'all Catholic families enthroned to His Sacred Heart, devotees of the First Friday', tags: '["sacred_heart","devotion","mercy","love"]',
    brief: 'The pierced and burning Heart of Jesus, revealed to St. Margaret Mary Alacoque.',
    quote: 'Behold this Heart which has so loved men.',
    adult: 'The Solemnity of the Most Sacred Heart of Jesus is celebrated on the Friday after the Second Sunday after Pentecost. It contemplates the visible, physical Heart of Christ as the symbol of his divine and human love, especially his love for all mankind shown in his Passion. The modern devotion was given fresh urgency through the visions of St. Margaret Mary Alacoque (1647-1690) at Paray-le-Monial.' },

  { slug: 'visitation', name: 'The Visitation', feast: '05-31', cat: 'feast', era: '1st century', nat: 'Israelite',
    patron: 'expectant mothers, the elderly, family visits', tags: '["marian","visitation","magnificat","mary"]',
    brief: 'Mary, newly pregnant, hurries into the hill country to her cousin Elizabeth.',
    quote: 'My soul magnifies the Lord.',
    adult: 'The feast of the Visitation (Luke 1:39-56) celebrates Mary\'s visit to her cousin Elizabeth shortly after the Annunciation. The first Christian act recorded in Scripture is Mary carrying Christ in her womb to bless another household. At the meeting, Elizabeth\'s child (John the Baptist) leaps in the womb and Mary breaks into the Magnificat. A feast of family, of hidden grace, and of the unborn.' }
];

for (const c of compact) {
  saints.push({
    slug: c.slug, name: c.name, feast_day: c.feast, category: c.cat, era: c.era, nationality: c.nat,
    patron_of: c.patron,
    brief: c.brief,
    full_story_child: c.brief + ' We can ask this saint to pray for our family.',
    full_story_teen: c.adult,
    full_story_adult: c.adult,
    key_quote: c.quote,
    theology_tags: c.tags,
    age_appropriate: 'all'
  });
}

module.exports = saints;
