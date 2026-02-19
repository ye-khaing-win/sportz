import { eq } from 'drizzle-orm';
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

async function main() {
  try {
    console.log('Performing CRUD operations on Sports Schema...');

    // CREATE: Insert a new match
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport: 'Football',
        homeTeam: 'Red Eagles',
        awayTeam: 'Blue Sharks',
        status: 'scheduled',
        startTime: new Date(Date.now() + 3600 * 1000), // Starts in 1 hour
      })
      .returning();

    if (!newMatch) throw new Error('Failed to create match');
    console.log('✅ CREATE: New match created:', newMatch);

    // READ: Select the match
    const foundMatch = await db.query.matches.findFirst({
      where: eq(matches.id, newMatch.id),
      with: {
        commentary: true,
      }
    });
    console.log('✅ READ: Found match:', foundMatch);

    // CREATE: Add commentary
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        minute: 1,
        message: 'Match has started!',
        eventType: 'whistle',
        period: '1H',
      })
      .returning();
    console.log('✅ CREATE: Commentary added:', newCommentary);

    // UPDATE: Update match score
    const [updatedMatch] = await db
      .update(matches)
      .set({ 
        status: 'live', 
        homeScore: 1 
      })
      .where(eq(matches.id, newMatch.id))
      .returning();
    console.log('✅ UPDATE: Match updated:', updatedMatch);

    // DELETE: Cleanup (optional, but good for a demo script to keep DB clean if needed, 
    // or we can leave it to show data persistence)
    // await db.delete(commentary).where(eq(commentary.matchId, newMatch.id));
    // await db.delete(matches).where(eq(matches.id, newMatch.id));
    // console.log('✅ DELETE: Cleaned up demo data.');

    console.log('\nOperations completed successfully.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Database pool closed.');
    }
  }
}

main();
