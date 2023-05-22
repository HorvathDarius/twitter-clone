import next from "next/types";
import { nextTick } from "process";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  infiniteFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    // create a query to load tweets
    .query(async ({ input: { limit = 10, cursor }, ctx }) => {
      const currentUserId = ctx.session?.user.id;

      // using prisma to find them
      const data = await ctx.prisma.tweet.findMany({
        // limit how much to get
        take: limit + 1,
        // cursor, virtual indicator of where we are in the tweets
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        // Here we deifne what we want to get from thee data
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: { select: { likes: true } },
          likes:
            currentUserId == null
              ? false
              : { where: { userId: currentUserId } },
          user: {
            select: {
              name: true,
              id: true,
              image: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (data.length > limit) {
        const nextItem = data.pop();
        if (nextItem != null) {
          nextCursor = { id: nextItem?.id, createdAt: nextItem?.createdAt };
        }
      }

      return {
        tweets: data.map((tweet) => {
          return {
            id: tweet.id,
            content: tweet.content,
            createdAt: tweet.createdAt,
            likeCount: tweet._count.likes,
            user: tweet.user,
            likedByMe: tweet.likes?.length > 0,
          };
        }),
        nextCursor,
      };
    }),

  // Here we will create our procedure
  // It is a protected procedure which means that you have to be authenticated
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    // Mutation, we are doing some changes to the database
    .mutation(async ({ input: { content }, ctx }) => {
      // accessing prisma and creating a tweet with the content and userId
      const tweet = await ctx.prisma.tweet.create({
        data: { content, userId: ctx.session.user.id },
      });

      return tweet;
    }),
});
