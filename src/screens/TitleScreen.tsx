import { COPY } from '../game/config/copy';

export default function TitleScreen() {
  return (
    <main className="screen screen--title">
      <h1 className="l1">{COPY.title}</h1>
      <p className="sub">{COPY.tagline}</p>
      <p className="meta">{COPY.scope}</p>
      <button className="capsule" type="button" disabled>
        {COPY.start}
      </button>
      <p className="status">{COPY.scaffoldNote}</p>
    </main>
  );
}
