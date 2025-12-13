import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

let app;
let mongo;
let userA;
let userB;
let authToken;

const buildAuthHeader = () => ({ Authorization: `Bearer ${authToken}` });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_SECRET = "test";
  process.env.NODE_ENV = "test";

  const [
    { default: serverApp },
    { default: User },
    { default: Friend },
    { getPrivateKey },
  ] = await Promise.all([
    import("../server.js"),
    import("../models/User.js"),
    import("../models/Friend.js"),
    import("../utils/jwtKeys.js"),
  ]);

  app = serverApp;

  userA = await User.create({
    email: "alice@example.com",
    username: "alice",
    passwordHash: "x",
  });
  userB = await User.create({
    email: "bob@example.com",
    username: "bob",
    passwordHash: "x",
  });

  await Friend.create({
    userId: userA._id,
    friendId: userB._id,
    status: "accepted",
  });
  await Friend.create({
    userId: userB._id,
    friendId: userA._id,
    status: "accepted",
  });

  authToken = jwt.sign(
    { sub: userA._id.toString(), email: userA.email, role: "user" },
    getPrivateKey(),
    { algorithm: "RS256", issuer: "northstar", audience: "northstar.app" }
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

describe("Friends privacy and mini-challenges", () => {
  test("PATCH /api/friends/:id/privacy updates shareInsights", async () => {
    const Friend = (await import("../models/Friend.js")).default;
    const connection = await Friend.findOne({
      userId: userA._id,
      friendId: userB._id,
    });

    const res = await request(app)
      .patch(`/api/friends/${connection._id}/privacy`)
      .set(buildAuthHeader())
      .send({ shareInsights: false })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.shareInsights).toBe(false);

    const updated = await Friend.findById(connection._id).lean();
    expect(updated.shareInsights).toBe(false);
  });

  test("POST /api/friends/challenges creates and GET lists mini-challenges", async () => {
    const createRes = await request(app)
      .post("/api/friends/challenges")
      .set(buildAuthHeader())
      .send({
        target: userB.email,
        templateId: "hydration",
        title: "Hydration Buddy",
        description: "Drink 8 glasses today together",
        reward: "+5 pts",
        note: "Stay hydrated!",
      })
      .expect(200);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.templateId).toBe("hydration");
    expect(createRes.body.data.note).toBe("Stay hydrated!");

    const listRes = await request(app)
      .get("/api/friends/challenges")
      .set(buildAuthHeader())
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.count).toBe(1);
    const [challenge] = listRes.body.data;
    expect(challenge.templateId).toBe("hydration");
    expect(challenge.status).toBe("sent");
  });
});
