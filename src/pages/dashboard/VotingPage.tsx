import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, CheckCircle, Users, Shield, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import VoteOnChain from "@/components/voting/VoteOnChain";
import { useAlgorand } from "@/hooks/useAlgorand";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

export default function VotingPage() {
  const { isAuthenticated, user } = useAppStore();
  const { address } = useAlgorand();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const token = localStorage.getItem("trustsphere_token");
        const res = await fetch("/api/election/list", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setElections(data.elections);
          
          // Mark elections where user has already voted
          const voted = new Set<string>();
          data.elections.forEach((election: any) => {
            if (election.hasVoted) {
              voted.add(election.id.toString());
            }
          });
          setVotedElections(voted);
        }
      } catch (error) {
        console.error("Failed to fetch elections", error);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, [address]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-sm text-muted-foreground">Cast your vote anonymously, verified on-chain.</p>
        </div>

        {!address && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-400">Wallet Connection Required</p>
                <p className="text-xs text-muted-foreground">Connect Pera Wallet to participate in elections.</p>
              </div>
            </div>
            <WalletConnectButton />
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading elections...</div>
        ) : elections.length === 0 ? (
          <div className="text-center py-10 rounded-xl bg-muted/20 border border-muted">
            <div className="mb-2 flex justify-center"><Vote className="h-10 w-10 text-muted-foreground/50" /></div>
            <h3 className="text-lg font-semibold">No Active Elections</h3>
            <p className="text-sm text-muted-foreground">Check back later for upcoming votes.</p>
          </div>
        ) : (
          elections.map((election) => (
            <motion.div
              key={election.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 divide-y divide-border/50"
            >
              <div className="mb-4 flex items-center justify-between pb-4">
                <div>
                  <h2 className="text-lg font-semibold">{election.title}</h2>
                  <p className="text-xs text-muted-foreground">Ends: {new Date(election.endsAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${election.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}>
                  {election.status}
                </span>
              </div>

              {election.candidates.length > 0 ? (
                <div className="pt-4 space-y-6">
                  {/* Show who student voted for if they already voted */}
                  {votedElections.has(election.id.toString()) && election.votedFor !== null && election.votedFor !== undefined && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl bg-accent/5 border border-accent/20 p-4 mb-4"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-accent" />
                        <div>
                          <p className="text-sm font-semibold text-accent">You voted for:</p>
                          <p className="text-base font-bold">{election.candidates[election.votedFor]?.name}</p>
                          {election.candidates[election.votedFor]?.party && (
                            <p className="text-xs text-muted-foreground">{election.candidates[election.votedFor]?.party}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    {election.candidates.map((c: any, i: number) => {
                      const isSelected = selectedCandidate === i && selectedElection === election.id.toString();
                      const hasVotedInThisElection = votedElections.has(election.id.toString());
                      const isVotedCandidate = hasVotedInThisElection && election.votedFor === i;
                      
                      return (
                        <button
                          key={c.name}
                          onClick={() => {
                            if (!hasVotedInThisElection && address) {
                              setSelectedCandidate(i);
                              setSelectedElection(election.id.toString());
                            }
                          }}
                          disabled={hasVotedInThisElection || !address}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                            isVotedCandidate
                              ? "border-accent bg-accent/10 ring-2 ring-accent"
                              : isSelected
                              ? "border-accent bg-accent/5 ring-1 ring-accent"
                              : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                          } ${(hasVotedInThisElection || !address) && !isSelected && !isVotedCandidate ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                              isVotedCandidate ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                            }`}>
                              {c.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.party}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(isSelected || isVotedCandidate) && <CheckCircle className={`h-4 w-4 ${isVotedCandidate ? "text-accent" : "text-accent"}`} />}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {c.votes}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Voting Action Area */}
                  <AnimatePresence>
                    {selectedCandidate !== null && 
                     selectedElection === election.id.toString() && 
                     !votedElections.has(election.id.toString()) && 
                     address && 
                     election.status === "active" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                          <div className="mb-4 text-sm">
                            <span className="text-muted-foreground">Selected Candidate: </span>
                            <span className="font-bold text-foreground">{election.candidates[selectedCandidate].name}</span>
                          </div>
                          <VoteOnChain
                            electionId={election.id.toString()}
                            candidateIndex={selectedCandidate}
                            candidateName={election.candidates[selectedCandidate].name}
                            electionTitle={election.title}vote is immutable on Algorand blockchain
                            senderAddress={address}
                            onSuccess={(txId) => {
                              setVotedElections(prev => new Set(prev).add(election.id.toString()));
                              setSelectedCandidate(null);
                              setSelectedElection(null);
                              // Refresh elections data
                              setTimeout(() => {
                                window.location.reload();
                              }, 2500);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {votedElections.has(election.id.toString()) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center p-4 text-center rounded-xl bg-accent/5 border border-accent/20"
                    >
                      <CheckCircle className="h-8 w-8 text-accent mb-2" />
                      <p className="font-semibold text-accent">Vote Cast Successfully!</p>
                      <p className="text-xs text-muted-foreground">Your anonymous choice is immutable on Algorand.</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="pt-4 text-center text-sm text-muted-foreground">
                  No candidates registered yet.
                </div>
              )}
            </motion.div>
          )))}
      </div>
    </DashboardLayout>
  );
}
