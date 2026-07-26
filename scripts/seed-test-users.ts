import mongoose from 'mongoose';
import { config } from '../src/config/environment.js';
import { User } from '../src/models/User.js';
import { Match } from '../src/models/Match.js';
import { Message, Conversation } from '../src/models/Message.js';
import { Post } from '../src/models/Post.js';

const COUNT = 60;
const PASSWORD = 'Test1234!';
const firstNames = ['Alice', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Noah', 'Chloé', 'Louis', 'Inès', 'Gabriel', 'Maya', 'Arthur', 'Jade', 'Nathan', 'Zoé'];
const lastNames = ['Martin', 'Bernard', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent'];
const cities = ['Paris', 'Lyon', 'Bordeaux', 'Lille', 'Nantes', 'Marseille', 'Toulouse', 'Nice', 'Rennes', 'Montpellier'];
const interests = ['voyage', 'photo', 'musique', 'cinéma', 'cuisine', 'sport', 'lecture', 'nature', 'art', 'technologie', 'danse', 'randonnée'];
const bios = [
  'Toujours partant(e) pour découvrir un nouvel endroit et partager de bons moments.',
  'Passionné(e) de création, de musique et de rencontres authentiques.',
  'Un café, une balade et une longue conversation : le programme parfait.',
  'Curieux(se), positif(ve) et amateur(trice) de nouvelles expériences.',
  'Ici pour échanger, rire et rencontrer des personnes qui partagent mes passions.',
];
const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
];

async function upsertUsers() {
  const users = [];
  for (let index = 1; index <= COUNT; index += 1) {
    const suffix = String(index).padStart(3, '0');
    const email = `test.user${suffix}@loop.local`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        username: `loop_test_${suffix}`,
        password: PASSWORD,
        firstName: firstNames[(index - 1) % firstNames.length],
        lastName: lastNames[(index - 1) % lastNames.length],
        avatar: avatars[(index - 1) % avatars.length],
        bio: bios[(index - 1) % bios.length],
        location: cities[(index - 1) % cities.length],
        interests: [
          interests[(index - 1) % interests.length],
          interests[(index + 2) % interests.length],
          interests[(index + 5) % interests.length],
        ],
        isOnline: false,
        lastSeen: new Date(Date.now() - index * 25 * 60 * 1000),
      });
    }
    users.push(user);
  }
  return users;
}

async function seedMatchesAndChats(users: Awaited<ReturnType<typeof upsertUsers>>) {
  const primary = users[0];
  for (let index = 1; index <= 15; index += 1) {
    const other = users[index];
    const participants = [primary._id.toString(), other._id.toString()].sort();
    await Match.findOneAndUpdate(
      { user1Id: participants[0], user2Id: participants[1] },
      {
        $set: {
          status: 'matched',
          compatibility: 68 + (index % 29),
          commonInterests: primary.interests.filter((item) => other.interests.includes(item)),
          matchedAt: new Date(Date.now() - index * 86400000),
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      },
      { upsert: true, new: true }
    );

    let conversation = await Conversation.findOne({ participants: { $all: participants, $size: 2 } });
    if (!conversation) conversation = await Conversation.create({ participants });
    const seededMessage = await Message.findOne({
      conversationId: conversation._id.toString(),
      content: { $regex: /^Bonjour, je suis un profil de test/ },
    });
    if (!seededMessage) {
      const message = await Message.create({
        senderId: other._id.toString(),
        receiverId: primary._id.toString(),
        conversationId: conversation._id.toString(),
        content: `Bonjour, je suis un profil de test 👋 On partage quelques centres d’intérêt !`,
        messageType: 'text',
        isRead: false,
      });
      conversation.lastMessage = message;
      conversation.lastMessageAt = message.createdAt;
      await conversation.save();
    }
  }
}

async function seedPosts(users: Awaited<ReturnType<typeof upsertUsers>>) {
  const images = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
  ];
  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    for (let postIndex = 1; postIndex <= 3; postIndex += 1) {
      const marker = `[TEST-${userIndex + 1}-${postIndex}]`;
      await Post.findOneAndUpdate(
        { authorId: users[userIndex]._id.toString(), content: { $regex: marker.replace(/[[\]]/g, '\\$&') } },
        { $setOnInsert: {
          authorId: users[userIndex]._id.toString(),
          content: `${marker} Un petit moment que j’avais envie de partager avec la communauté Loop ✨`,
          image: postIndex !== 2 ? images[(userIndex + postIndex) % images.length] : undefined,
          likesCount: 12 + userIndex + postIndex * 7,
          commentsCount: postIndex * 2,
        } },
        { upsert: true, new: true }
      );
    }
  }
}

async function main() {
  await mongoose.connect(config.mongodbUri);
  const users = await upsertUsers();
  await seedMatchesAndChats(users);
  await seedPosts(users);
  console.log(JSON.stringify({
    usersReady: users.length,
    matchedProfiles: 15,
    login: 'test.user001@loop.local',
    password: PASSWORD,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
