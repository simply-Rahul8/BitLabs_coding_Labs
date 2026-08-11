import { useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

export default function TakeAssessment() {
  const { token } = useParams();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Assessment</h2>
        <p className="mt-1 text-sm text-slate-600">Token: {token}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Spinner label="Preparing assessment workspace" />
        <div className="mt-5">
          <Button>Start assessment</Button>
        </div>
      </div>
    </section>
  );
}
