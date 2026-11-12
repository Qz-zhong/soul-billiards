import { COPY } from '../game/config/copy';

export default function TitleScreen({ onStart }: { onStart: () => void }): JSX.Element {
  return (
    <main className="screen screen--title">
      <h1 className="l1">{COPY.title}</h1>
      <p className="sub">{COPY.tagline}</p>
      <p className="meta">{COPY.scope}</p>
      <button className="capsule" type="button" onClick={onStart}>
        {COPY.start}
      </button>
      <p className="status">{COPY.stageNote}</p>
    </main>
  );
}
