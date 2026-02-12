import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Vote, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  name: string;
  party: string;
}

export default function CreateElection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: "", party: "" },
    { name: "", party: "" },
  ]);

  const addCandidate = () => {
    setCandidates([...candidates, { name: "", party: "" }]);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, field: "name" | "party", value: string) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("trustsphere_token");
      const res = await fetch("/api/election/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          candidates: candidates.filter((c) => c.name.trim() !== ""),
          endsAt: new Date(endsAt).toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create election");
      }

      toast({
        title: "Election Created!",
        description: `${title} has been created successfully.`,
        variant: "default",
      });

      // Reset form
      setTitle("");
      setEndsAt("");
      setCandidates([
        { name: "", party: "" },
        { name: "", party: "" },
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Vote className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Create New Election</h3>
          <p className="text-sm text-muted-foreground">Set up a voting system for students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Election Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Election Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Class Representative Election 2026"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        {/* Candidates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Candidates (minimum 2)</label>
            <Button
              type="button"
              onClick={addCandidate}
              variant="outline"
              size="sm"
              className="h-8 gap-1"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(index, "name", e.target.value)}
                    placeholder={`Candidate ${index + 1} name`}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <input
                    type="text"
                    value={candidate.party}
                    onChange={(e) => updateCandidate(index, "party", e.target.value)}
                    placeholder="Party/Group (optional)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {candidates.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    variant="ghost"
                    size="sm"
                    className="h-auto text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full btn-glow"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Election...
            </>
          ) : (
            <>
              <Vote className="mr-2 h-4 w-4" />
              Create Election
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
