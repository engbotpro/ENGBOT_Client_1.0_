declare namespace JSX {
    interface IntrinsicElements {
      style: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLStyleElement>,
        HTMLStyleElement
      > & {
        jsx?: boolean;
        global?: boolean;
      };
    }
  }
  