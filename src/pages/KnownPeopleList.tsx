import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trash2, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllPeople, deletePerson, Person } from "@/lib/personStore";
import PageHeader from "@/components/PageHeader";

const KnownPeopleList = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setPeople(getAllPeople());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePerson(id);
    setPeople(getAllPeople());
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12">
        <button 
          onClick={() => navigate("/caregiver-dashboard")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Panel
        </button>

        <PageHeader 
          title="Known People" 
          subtitle={`Managing ${people.length} registered profiles`} 
          icon={<Users className="h-5 w-5" />} 
        />

        {/* Search bar */}
        {people.length > 0 && (
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {people.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-12 px-4 glass-card border-dashed"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No people added yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start by adding someone you know using the camera.</p>
                <button 
                  onClick={() => navigate("/add-person")} 
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors active:scale-95"
                >
                  Add Someone Now
                </button>
              </motion.div>
            ) : filteredPeople.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-muted-foreground py-8">
                No matches found.
              </motion.p>
            ) : (
              filteredPeople.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="glass-card flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-4">
                      <div className="glass-orb h-12 w-12 shrink-0 overflow-hidden">
                        {person.profileImage ? (
                          <img src={person.profileImage} alt={person.name} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold tracking-wide truncate">{person.name}</p>
                        <p className="text-sm font-medium text-muted-foreground/80 truncate">{person.relationship}</p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(person.id, e)}
                        className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center transition-all hover:bg-destructive/20 active:scale-95 shrink-0"
                        aria-label="Delete person"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    {person.description && (
                      <div className="bg-background/40 rounded-lg p-3 mt-1 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                        {person.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Last Interaction</span>
                      <span className="text-[11px] font-semibold text-foreground/80">
                        {new Date(person.lastInteraction).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default KnownPeopleList;
