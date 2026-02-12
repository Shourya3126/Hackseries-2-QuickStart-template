import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Trophy, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  name: string;
  party: string;
  votes: number;
  percentage: string;
}

interface Election {
  id: string;
  title: string;
  status: string;
  endsAt: string;
  totalVotes: number;
  totalVoters: number;
  candidates: Candidate[];
}

export default function ElectionResults() {
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchElections = async () => {
    try {
      const token = localStorage.getItem("trustsphere_token");
      const res = await fetch("/api/election/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        
        // Fetch detailed results for each election
        const electionsWithResults = await Promise.all(
          data.elections.map(async (election: any) => {
            const resultRes = await fetch(`/api/chain/vote/result/${election.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (resultRes.ok) {
              const resultData = await resultRes.json();
              return resultData.election;
            }
            return election;
          })
        );

        setElections(electionsWithResults);
      }
    } catch (error) {
      console.error("Failed to fetch election results", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (electionId: string) => {
    if (!confirm("Are you sure you want to delete this election? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("trustsphere_token");
      const res = await fetch(`/api/election/${electionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({
          title: "Election Deleted",
          description: "The election has been removed successfully.",
        });
        fetchElections(); // Refresh the list
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete election");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchElections();
    // Refresh every 10 seconds
    const interval = setInterval(fetchElections, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground">Loading election results...</p>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Trophy className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">No Elections Yet</h3>
        <p className="text-sm text-muted-foreground">Create an election to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {elections.map((election) => {
        const winner = election.candidates.reduce((prev, current) => 
          current.votes > prev.votes ? current : prev
        );

        return (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            {/* Election Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{election.title}</h3>
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ends: {new Date(election.endsAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {election.totalVoters} voters
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    election.status === "active"
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {election.status}
                </span>
                <button
                  onClick={() => handleDeleteElection(election.id)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete election"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Winner Highlight */}
            {election.totalVotes > 0 && (
              <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <Trophy className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currently Leading</p>
                    <p className="text-lg font-bold text-accent">{winner.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {winner.votes} votes ({winner.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Candidates Results */}
            <div className="space-y-3">
              {election.candidates
                .sort((a, b) => b.votes - a.votes)
                .map((candidate, index) => (
                  <div
                    key={candidate.name}
                    className="rounded-lg border border-border/50 bg-muted/20 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0
                              ? "bg-accent/20 text-accent"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          {candidate.party && (
                            <p className="text-xs text-muted-foreground">{candidate.party}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-accent">{candidate.votes}</p>
                        <p className="text-xs text-muted-foreground">{candidate.percentage}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full ${
                          index === 0 ? "bg-accent" : "bg-primary/50"
                        }`}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Total Stats */}
            <div className="mt-4 flex items-center justify-center gap-6 rounded-lg bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Total Votes:</span>
                <span className="font-semibold">{election.totalVotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Voter Turnout:</span>
                <span className="font-semibold">{election.totalVoters}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
